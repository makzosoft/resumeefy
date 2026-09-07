export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { CREDIT_COSTS, addCredits, saveCourse, spendCredits, trackEvent } from "@/lib/data";
import { evaluateInterviewAnswer, generateCourse, generateDesktopScenario, generateInterviewQuestions, generateResume, scoreResumeQuality, matchJob } from "@/lib/openai";

const resumeSchema=z.object({resume:z.record(z.string(),z.unknown()),jobDescription:z.string().max(12000).optional(),tier:z.enum(["boost","professional","executive","international"]).optional()});
const roleSchema=z.object({targetRole:z.string().min(2),targetCompany:z.string().optional(),jobDescription:z.string().max(12000).optional(),candidate:z.record(z.string(),z.unknown()).optional()});
const feedbackSchema=z.object({question:z.string().min(5),answer:z.string().min(10),targetRole:z.string().optional(),targetCompany:z.string().optional(),jobDescription:z.string().max(12000).optional(),candidate:z.record(z.string(),z.unknown()).optional(),history:z.array(z.unknown()).optional()});
const courseSchema=z.object({targetRole:z.string().min(2).optional(),jobDescription:z.string().max(12000).optional(),resume:z.record(z.string(),z.unknown()).optional()});
const matchSchema=z.object({resume:z.record(z.string(),z.unknown()),jobDescription:z.string().min(20).max(12000)});

async function charge(userId:string, amount:number, feature:string){
  try{return await spendCredits(userId,amount,feature)}catch(e){if(String(e).includes("INSUFFICIENT_CREDITS")) throw Object.assign(new Error("You have run out of credits. Buy a credit pack to continue."),{code:"INSUFFICIENT_CREDITS"});throw e;}
}
function fail(e:unknown){if(e && typeof e === "object" && "code" in e && (e as any).code === "INSUFFICIENT_CREDITS") return NextResponse.json({error:(e as Error).message,code:"INSUFFICIENT_CREDITS"},{status:402});return NextResponse.json({error:e instanceof Error?e.message:"AI request failed"},{status:502});}

export async function POST(req:NextRequest){
  const body=await req.json().catch(()=>null) as Record<string,unknown>|null; const action=String(body?.action||req.nextUrl.searchParams.get("action")||"").toLowerCase();
  const session=await getCurrentSession();
  if(action!=="tts"&&action!=="blog_preview"&&!session)return NextResponse.json({error:"Sign in required"},{status:401});
  let chargedAmount = 0;
  const chargeFor = async (amount:number, feature:string) => { const result=await charge(session!.sub,amount,feature); chargedAmount=amount; return result; };
  try{
    if(action==="resume") { const p=resumeSchema.safeParse(body); if(!p.success)return NextResponse.json({error:"Invalid resume data"},{status:400}); await chargeFor(CREDIT_COSTS.resume_ai,"resume_ai"); return NextResponse.json(await generateResume(p.data)); }
    if(action==="resume_quality") { const p=z.object({resume:z.record(z.string(),z.unknown())}).safeParse(body); if(!p.success)return NextResponse.json({error:"Invalid resume"},{status:400}); await chargeFor(CREDIT_COSTS.resume_quality,"resume_quality"); return NextResponse.json(await scoreResumeQuality(p.data)); }
    if(action==="job_match") { const p=matchSchema.safeParse(body); if(!p.success)return NextResponse.json({error:"Resume and job description are required"},{status:400}); await chargeFor(CREDIT_COSTS.job_match,"job_match"); return NextResponse.json(await matchJob(p.data)); }
    if(action==="interview_questions") { const p=roleSchema.safeParse(body); if(!p.success)return NextResponse.json({error:"Target role is required"},{status:400}); await chargeFor(CREDIT_COSTS.interview,"interview_questions"); return NextResponse.json(await generateInterviewQuestions({...p.data,userId:session!.sub})); }
    if(action==="interview_feedback") { const p=feedbackSchema.safeParse(body); if(!p.success)return NextResponse.json({error:"Question and answer are required"},{status:400}); await chargeFor(CREDIT_COSTS.interview_feedback,"interview_feedback"); return NextResponse.json(await evaluateInterviewAnswer({...p.data,userId:session!.sub})); }
    if(action==="desktop") { const p=roleSchema.safeParse(body); if(!p.success)return NextResponse.json({error:"Target role is required"},{status:400}); await chargeFor(CREDIT_COSTS.desktop_sim,"desktop_sim"); return NextResponse.json(await generateDesktopScenario(p.data)); }
    if(action==="course") { const p=courseSchema.safeParse(body); if(!p.success || (!p.data.targetRole && !p.data.resume))return NextResponse.json({error:"Add a target role or resume"},{status:400}); await chargeFor(CREDIT_COSTS.course_generation,"course_generation"); const course=await generateCourse(p.data); const id=await saveCourse(session!.sub,{...course,content:course.modules}); await trackEvent("course_generated",{userId:session!.sub,meta:{courseId:id,targetRole:course.targetRole}}); return NextResponse.json({id,course}); }
    if(action==="course_recommendation") { const p=courseSchema.safeParse(body); if(!p.success || (!p.data.targetRole && !p.data.resume))return NextResponse.json({error:"Add a target role or resume"},{status:400}); return NextResponse.json({recommendations:["Role foundations","Tools employers expect","Portfolio project","Interview readiness"],message:"Your course path will be generated around your target role, resume and job description."}); }
    if(action==="tts") { const text=typeof body?.text==="string"?body.text.trim():""; if(!text)return NextResponse.json({error:"Text is required"},{status:400}); if(text.length>1200)return NextResponse.json({error:"Voiceover text is too long"},{status:400}); if(session) await chargeFor(1,"tts"); const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return NextResponse.json({error:"OPENAI_API_KEY is not configured"},{status:500}); const response=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_TTS_MODEL||"gpt-4o-mini-tts",voice:process.env.OPENAI_TTS_VOICE||"coral",input:text,instructions:process.env.OPENAI_TTS_INSTRUCTIONS||"Warm, eloquent female career coach. Natural, calm, encouraging, polished international English with a friendly Nigerian feel.",speed:Number(process.env.OPENAI_TTS_SPEED||"1"),response_format:"mp3"})}); if(!response.ok)return NextResponse.json({error:`OpenAI voice request failed: ${(await response.text()).slice(0,300)}`},{status:response.status}); return new Response(await response.arrayBuffer(),{headers:{"Content-Type":"audio/mpeg","Cache-Control":"private,max-age=3600"}}); }
    return NextResponse.json({error:"Unknown AI action"},{status:400});
  }catch(e){ if(session && chargedAmount>0) await addCredits(session.sub,chargedAmount,"refund","ai_failed").catch(()=>{}); return fail(e) }
}
