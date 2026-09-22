export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  CREDIT_COSTS,
  getCourseCertificates,
  getUserAssessments,
  saveAssessment,
  saveCourseCertificate,
  saveCourseSubmission,
  spendCredits,
  trackEvent,
  getUnlockedLessons,
  unlockCourseLesson,
} from "@/lib/data";

const schema = z.object({
  scores: z.record(z.string(), z.number()),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  xp: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const action = String(body?.action || "save").toLowerCase();

  if (action === "course_submit") {
    const p = z
      .object({
        courseId: z.string(),
        submissionText: z.string().min(20),
        projectUrl: z.string().url().optional(),
        deadlineAt: z.string().optional(),
      })
      .safeParse(body);
    if (!p.success) return NextResponse.json({ error: "Submit a meaningful project response" }, { status: 400 });
    await saveCourseSubmission({
      course_id: p.data.courseId,
      user_id: session.sub,
      submission_text: p.data.submissionText,
      project_url: p.data.projectUrl || null,
      submitted_at: new Date().toISOString(),
      deadline_at: p.data.deadlineAt || null,
      status: "submitted",
    });
    await trackEvent("course_project_submitted", { userId: session.sub, meta: { courseId: p.data.courseId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "course_late_unlock") {
    const p = z.object({ courseId: z.string() }).safeParse(body);
    if (!p.success) return NextResponse.json({ error: "Course is required" }, { status: 400 });
    try {
      await spendCredits(session.sub, CREDIT_COSTS.course_late_unlock, "course_late_unlock", p.data.courseId);
      await trackEvent("course_late_unlock", { userId: session.sub, meta: { courseId: p.data.courseId, cost: CREDIT_COSTS.course_late_unlock } });
      return NextResponse.json({ ok: true, cost: CREDIT_COSTS.course_late_unlock });
    } catch (e) {
      if (String(e).includes("INSUFFICIENT_CREDITS")) {
        return NextResponse.json({ error: "You need credits to continue this course.", code: "INSUFFICIENT_CREDITS" }, { status: 402 });
      }
      throw e;
    }
  }

  if (action === "course_lesson_unlock") {
    const p = z.object({ courseSlug: z.string().min(1), lessonId: z.string().min(1) }).safeParse(body);
    if (!p.success) return NextResponse.json({ error: "Course and lesson are required" }, { status: 400 });
    try {
      const result = await unlockCourseLesson(session.sub, p.data.courseSlug, p.data.lessonId, CREDIT_COSTS.course_lesson);
      if (!result.alreadyUnlocked) {
        await trackEvent("course_lesson_unlock", { userId: session.sub, meta: { ...p.data, cost: CREDIT_COSTS.course_lesson } });
      }
      return NextResponse.json({ ok: true, balance: result.balance, alreadyUnlocked: result.alreadyUnlocked });
    } catch (e) {
      if (String(e).includes("INSUFFICIENT_CREDITS")) {
        return NextResponse.json({ error: "You need more credits to unlock this lesson.", code: "INSUFFICIENT_CREDITS" }, { status: 402 });
      }
      throw e;
    }
  }

  if (action === "course_certificate") {
    const p = z.object({ courseId: z.string() }).safeParse(body);
    if (!p.success) return NextResponse.json({ error: "Course is required" }, { status: 400 });
    try {
      await spendCredits(session.sub, CREDIT_COSTS.course_certificate, "course_certificate", p.data.courseId);
      // Timestamp + random suffix, and — unlike before — actually saved, so
      // it can be looked up or verified later instead of existing only in
      // the response the user briefly saw.
      const certificateId = `RSMFY-C-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      await saveCourseCertificate(session.sub, p.data.courseId, certificateId);
      await trackEvent("course_certificate_issued", { userId: session.sub, meta: { courseId: p.data.courseId, certificateId } });
      return NextResponse.json({ ok: true, certificateId });
    } catch (e) {
      if (String(e).includes("INSUFFICIENT_CREDITS")) {
        return NextResponse.json({ error: "You need credits for the course certificate.", code: "INSUFFICIENT_CREDITS" }, { status: 402 });
      }
      throw e;
    }
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid assessment payload" }, { status: 400 });
  const { id, overall } = await saveAssessment(session.sub, parsed.data.scores, parsed.data.targetRole, parsed.data.targetCompany, parsed.data.xp ?? 0);
  await trackEvent("assessment_saved", { userId: session.sub, meta: { overall } });
  return NextResponse.json({ id, overall });
}

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (req.nextUrl.searchParams.get("action") === "certificates") {
    return NextResponse.json({ certificates: await getCourseCertificates(session.sub) });
  }

  if (req.nextUrl.searchParams.get("action") === "lesson_unlocks") {
    const courseSlug = req.nextUrl.searchParams.get("courseSlug") || "";
    if (!courseSlug) return NextResponse.json({ error: "courseSlug is required" }, { status: 400 });
    return NextResponse.json({ unlocked: await getUnlockedLessons(session.sub, courseSlug) });
  }

  return NextResponse.json({ assessments: await getUserAssessments(session.sub) });
}
