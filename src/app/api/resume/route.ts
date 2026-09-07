export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { CREDIT_COSTS, getResume, getLatestResume, upsertResume, unlockResume, spendCredits, trackEvent } from "@/lib/data";
const schema=z.object({resumeId:z.string().nullable().optional(),data:z.record(z.string(),z.unknown())});
const unlockSchema=z.object({resumeId:z.string(),tier:z.enum(["boost","professional","executive","international"]).default("boost")});
export async function POST(req:NextRequest){
 const session=await getCurrentSession();if(!session)return NextResponse.json({error:"Sign in required"},{status:401});
 const body=await req.json().catch(()=>null) as any; const action=String(body?.action||"save").toLowerCase();
 if(action==="unlock") { const p=unlockSchema.safeParse(body);if(!p.success)return NextResponse.json({error:"Choose a resume tier"},{status:400}); const costs={boost:CREDIT_COSTS.resume_boost,professional:CREDIT_COSTS.resume_professional,executive:CREDIT_COSTS.resume_executive,international:CREDIT_COSTS.resume_international}; try { await spendCredits(session.sub,costs[p.data.tier],`resume_${p.data.tier}`,p.data.resumeId); await unlockResume(p.data.resumeId,p.data.tier); await trackEvent("resume_unlocked",{userId:session.sub,meta:{tier:p.data.tier,cost:costs[p.data.tier]}}); return NextResponse.json({ok:true,tier:p.data.tier,cost:costs[p.data.tier]}); } catch(e){if(String(e).includes("INSUFFICIENT_CREDITS"))return NextResponse.json({error:"You need more credits to unlock this resume.",code:"INSUFFICIENT_CREDITS"},{status:402});throw e;} }
 const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Invalid resume payload"},{status:400});const id=await upsertResume(session.sub,parsed.data.resumeId??null,parsed.data.data);return NextResponse.json({id});
}
export async function GET(req:NextRequest){const session=await getCurrentSession();if(!session)return NextResponse.json({error:"Sign in required"},{status:401});const latest=req.nextUrl.searchParams.get("latest")==="1";const resumeId=req.nextUrl.searchParams.get("id");if(!resumeId&&!latest)return NextResponse.json({error:"Missing resume id"},{status:400});const resume=latest?await getLatestResume(session.sub):await getResume(resumeId!,session.sub);if(!resume)return NextResponse.json({error:"Not found"},{status:404});return NextResponse.json({id:resume.id,data:JSON.parse(resume.data_json),isUnlocked:Boolean(resume.is_unlocked)});}
