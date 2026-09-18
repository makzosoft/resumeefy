export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { CREDIT_COSTS, addCredits, saveCourse, spendCredits, trackEvent } from "@/lib/data";
import { validateResumeCopy } from "@/lib/resume-rules";
import {
  evaluateInterviewAnswer,
  generateBlog,
  generateCourse,
  generateDesktopScenario,
  generateInterviewQuestions,
  generateResume,
  scoreResumeQuality,
  matchJob,
  type GeneratedResume,
} from "@/lib/gemini";

// Bounds how large a client-supplied JSON blob (resume / candidate profile) can
// be before we reject it. These objects are free-form (z.record(unknown)), so
// there is no per-field limit otherwise — without this, a request could send
// an arbitrarily large payload straight through to the Gemini API on every
// call, at the requester's chosen cost to us.
function sizedRecord(maxChars: number) {
  return z.record(z.string(), z.unknown()).refine((val) => JSON.stringify(val).length <= maxChars, {
    message: `This is too large to process (max ${maxChars.toLocaleString()} characters once serialized).`,
  });
}

const resumeSchema = z.object({
  resume: sizedRecord(30000),
  jobDescription: z.string().max(12000).optional(),
  tier: z.enum(["boost", "professional", "executive", "international"]).optional(),
});
const roleSchema = z.object({
  targetRole: z.string().min(2),
  targetCompany: z.string().optional(),
  jobDescription: z.string().max(12000).optional(),
  candidate: sizedRecord(12000).optional(),
});
const feedbackSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(10).max(6000),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  jobDescription: z.string().max(12000).optional(),
  candidate: sizedRecord(12000).optional(),
  history: z.array(z.unknown()).max(50).optional(),
});
const courseSchema = z.object({
  targetRole: z.string().min(2).optional(),
  jobDescription: z.string().max(12000).optional(),
  resume: sizedRecord(30000).optional(),
});
const matchSchema = z.object({
  resume: sizedRecord(30000),
  jobDescription: z.string().min(20).max(12000),
});
const blogPreviewSchema = z.object({
  topic: z.string().min(3).max(200),
});

async function charge(userId: string, amount: number, feature: string) {
  try {
    return await spendCredits(userId, amount, feature);
  } catch (e) {
    if (String(e).includes("INSUFFICIENT_CREDITS")) {
      throw Object.assign(
        new Error("You have run out of credits. Buy a credit pack to continue."),
        { code: "INSUFFICIENT_CREDITS" }
      );
    }
    throw e;
  }
}

function fail(e: unknown, action: string) {
  const anyErr = e as any;

  if (anyErr?.code === "INSUFFICIENT_CREDITS") {
    console.warn(`[ai:err] action=${action} insufficient_credits`);
    return NextResponse.json(
      { error: anyErr.message || "You have run out of credits.", code: "INSUFFICIENT_CREDITS" },
      { status: 402 }
    );
  }
  if (anyErr?.code === "AI_QUOTA_EXHAUSTED") {
    console.error(`[ai:exhausted] action=${action} — all keys dead`);
    return NextResponse.json(
      { error: "AI is temporarily unavailable. Please try again later.", code: "AI_QUOTA_EXHAUSTED" },
      { status: 503 }
    );
  }
  if (anyErr?.code === "AI_NOT_CONFIGURED") {
    console.error(`[ai:config] action=${action} — GEMINI_API_KEYS is empty`);
    return NextResponse.json(
      { error: "AI is not configured on this server.", code: "AI_NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  console.error(`[ai:err] action=${action}`, anyErr?.message || anyErr);
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "AI request failed" },
    { status: 502 }
  );
}

// Applies the Resumeefy CV Standard's dash / first-person / filler checks
// (src/lib/resume-rules.ts) to a generated resume. Previously these checks
// existed but were never called from anywhere, so nothing enforced them.
function resumeCopyIssues(resume: GeneratedResume): string[] {
  const text = [resume.summary, ...resume.experience.flatMap((e) => e.bullets)].join("\n");
  return validateResumeCopy(text).issues;
}

async function generateResumeChecked(input: Record<string, unknown>): Promise<GeneratedResume> {
  const first = await generateResume(input);
  const issues = resumeCopyIssues(first);
  if (issues.length === 0) return first;

  console.warn(`[ai:quality] resume failed style check (${issues.join("; ")}) — regenerating once`);
  try {
    const retry = await generateResume(input);
    const retryIssues = resumeCopyIssues(retry);
    // Keep whichever draft has fewer style violations; never block the user
    // on this, since the underlying facts are still truthful either way.
    return retryIssues.length < issues.length ? retry : first;
  } catch {
    return first;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action || req.nextUrl.searchParams.get("action") || "").toLowerCase();
  const session = await getCurrentSession();
  const isPublic = action === "blog_preview";

  if (!isPublic && !session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let chargedAmount = 0;
  const chargeFor = async (amount: number, feature: string) => {
    const result = await charge(session!.sub, amount, feature);
    chargedAmount = amount;
    return result;
  };

  try {
    if (action === "resume") {
      const p = resumeSchema.safeParse(body);
      if (!p.success) return NextResponse.json({ error: "Invalid resume data" }, { status: 400 });
      await chargeFor(CREDIT_COSTS.resume_ai, "resume_ai");
      return NextResponse.json(await generateResumeChecked(p.data));
    }

    if (action === "resume_quality") {
      const p = z.object({ resume: sizedRecord(30000) }).safeParse(body);
      if (!p.success) return NextResponse.json({ error: "Invalid resume" }, { status: 400 });
      await chargeFor(CREDIT_COSTS.resume_quality, "resume_quality");
      return NextResponse.json(await scoreResumeQuality(p.data));
    }

    if (action === "job_match") {
      const p = matchSchema.safeParse(body);
      if (!p.success) {
        return NextResponse.json({ error: "Resume and job description are required" }, { status: 400 });
      }
      await chargeFor(CREDIT_COSTS.job_match, "job_match");
      return NextResponse.json(await matchJob(p.data));
    }

    if (action === "interview_questions") {
      const p = roleSchema.safeParse(body);
      if (!p.success) return NextResponse.json({ error: "Target role is required" }, { status: 400 });
      await chargeFor(CREDIT_COSTS.interview, "interview_questions");
      return NextResponse.json(await generateInterviewQuestions({ ...p.data, userId: session!.sub }));
    }

    if (action === "interview_feedback") {
      const p = feedbackSchema.safeParse(body);
      if (!p.success) {
        return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
      }
      await chargeFor(CREDIT_COSTS.interview_feedback, "interview_feedback");
      return NextResponse.json(await evaluateInterviewAnswer({ ...p.data, userId: session!.sub }));
    }

    if (action === "desktop") {
      const p = roleSchema.safeParse(body);
      if (!p.success) return NextResponse.json({ error: "Target role is required" }, { status: 400 });
      await chargeFor(CREDIT_COSTS.desktop_sim, "desktop_sim");
      return NextResponse.json(await generateDesktopScenario(p.data));
    }

    if (action === "course") {
      const p = courseSchema.safeParse(body);
      if (!p.success || (!p.data.targetRole && !p.data.resume)) {
        return NextResponse.json({ error: "Add a target role or resume" }, { status: 400 });
      }
      await chargeFor(CREDIT_COSTS.course_generation, "course_generation");
      const course = await generateCourse(p.data);
      const id = await saveCourse(session!.sub, { ...course, content: course.modules });
      await trackEvent("course_generated", {
        userId: session!.sub,
        meta: { courseId: id, targetRole: course.targetRole },
      });
      return NextResponse.json({ id, course });
    }

    if (action === "course_recommendation") {
      const p = courseSchema.safeParse(body);
      if (!p.success || (!p.data.targetRole && !p.data.resume)) {
        return NextResponse.json({ error: "Add a target role or resume" }, { status: 400 });
      }
      return NextResponse.json({
        recommendations: ["Role foundations", "Tools employers expect", "Portfolio project", "Interview readiness"],
        message: "Your course path will be generated around your target role, resume and job description.",
      });
    }

    if (action === "blog_preview") {
      // Public, unauthenticated, uncharged: generates a one-off preview post
      // for a topic without persisting it. (Previously this action was
      // checked for but never actually handled, so it always 400'd.)
      const p = blogPreviewSchema.safeParse(body);
      if (!p.success) return NextResponse.json({ error: "Provide a topic to preview" }, { status: 400 });
      const preview = await generateBlog({
        trendSignals: [p.data.topic],
        existingTopics: [],
        brand: "Resumeefy",
        audience: "job seekers in Nigeria and globally",
        serviceCatalog: ["resume_builder", "resume_analyzer", "interview", "assessment", "courses", "job_match", "desktop_sim"],
        marketingRequirement:
          "Every article must softly promote exactly one relevant Resumeefy service, mentioned naturally once, with a gentle closing next step. Never hype, fake urgency or hard sell.",
      });
      return NextResponse.json({ preview });
    }

    if (action === "tts") {
      return NextResponse.json(
        { error: "Server-side voice has been disabled. The app uses the browser voice.", code: "TTS_DISABLED" },
        { status: 410 }
      );
    }

    return NextResponse.json({ error: "Unknown AI action" }, { status: 400 });
  } catch (e) {
    if (session && chargedAmount > 0) {
      await addCredits(session.sub, chargedAmount, "refund", "ai_failed").catch(() => {});
      console.warn(`[ai:refund] action=${action} refunded=${chargedAmount}`);
    }
    return fail(e, action);
  }
}
