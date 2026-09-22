"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, track, CurrentUser } from "@/lib/client";
import { getCourseBySlug, INSTRUCTORS } from "@/lib/courses-content";
import { InstructorAvatar } from "@/components/InstructorAvatar";
import { LessonNarrator } from "@/components/LessonNarrator";
import { BulletBootcampGame } from "@/components/BulletBootcampGame";
import { CreditCoin } from "@/components/CreditCoin";
import { CREDIT_COSTS } from "@/lib/credit-costs";

function progressKey(slug: string) {
  return `resumeefy_course_progress_${slug}`;
}

function readProgress(slug: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(progressKey(slug)) || "{}");
  } catch {
    return {};
  }
}

export default function CourseViewer() {
  const params = useParams<{ slug: string }>();
  const course = useMemo(() => getCourseBySlug(params.slug), [params.slug]);
  const instructor = course ? INSTRUCTORS[course.instructorId] : undefined;

  const [activeLesson, setActiveLesson] = useState(0);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [user, setUser] = useState<CurrentUser>(null);
  const [certState, setCertState] = useState<"idle" | "loading" | "done" | "signin">("idle");
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!course) return;
    setProgress(readProgress(course.slug));
    api<{ user: CurrentUser }>("/api/auth").then((r) => {
      setUser(r.user);
      if (r.user) {
        api<{ unlocked: string[] }>(`/api/assessment?action=lesson_unlocks&courseSlug=${course.slug}`)
          .then((x) => setUnlockedLessons(x.unlocked))
          .catch(() => {});
      }
    });
    track("course_opened", { courseSlug: course.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.slug]);

  useEffect(() => {
    setSelectedAnswer(null);
    setAnswerState("idle");
  }, [activeLesson]);

  if (!course || !instructor) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Course not found</h1>
        <Link href="/courses" className="btn btn-primary mt-5 inline-flex">
          Back to courses
        </Link>
      </main>
    );
  }

  function isLocked(index: number) {
    if (index === 0) return false; // first lesson of every course is always free
    return !unlockedLessons.includes(course!.lessons[index].id);
  }

  async function unlockLesson(index: number) {
    if (!user) {
      window.location.href = `/signup?next=/courses/${course!.slug}`;
      return;
    }
    setUnlocking(true);
    try {
      const lessonId = course!.lessons[index].id;
      const r = await api<{ balance: number; alreadyUnlocked: boolean }>("/api/assessment", {
        method: "POST",
        body: JSON.stringify({ action: "course_lesson_unlock", courseSlug: course!.slug, lessonId }),
      });
      setUnlockedLessons((u) => (u.includes(lessonId) ? u : [...u, lessonId]));
      window.dispatchEvent(new CustomEvent("resumeefy:credits-updated", { detail: { balance: r.balance } }));
      setActiveLesson(index);
    } catch (e) {
      // A 402 here already opens the global CreditGate purchase modal via
      // the resumeefy:credits-needed event dispatched inside api() — nothing
      // extra to do for that case.
      const code = e instanceof Error ? (e as Error & { code?: string }).code : undefined;
      if (code !== "INSUFFICIENT_CREDITS") alert(e instanceof Error ? e.message : "Could not unlock this lesson");
    } finally {
      setUnlocking(false);
    }
  }

  const lesson = course.lessons[activeLesson];
  const completedCount = course.lessons.filter((l) => progress[l.id]).length;
  const allComplete = completedCount === course.lessons.length;

  function markLessonComplete(lessonId: string) {
    const next = { ...progress, [lessonId]: true };
    setProgress(next);
    window.localStorage.setItem(progressKey(course!.slug), JSON.stringify(next));
  }

  function checkAnswer(index: number) {
    setSelectedAnswer(index);
    if (index === lesson.quiz.correct) {
      setAnswerState("correct");
      markLessonComplete(lesson.id);
    } else {
      setAnswerState("wrong");
    }
  }

  async function claimCertificate() {
    if (!user) {
      setCertState("signin");
      return;
    }
    setCertState("loading");
    try {
      const r = await api<{ certificateId: string }>("/api/assessment", {
        method: "POST",
        body: JSON.stringify({ action: "course_certificate", courseId: course!.slug }),
      });
      setCertificateId(r.certificateId);
      setCertState("done");
    } catch (e) {
      setCertState("idle");
      const code = e instanceof Error ? (e as Error & { code?: string }).code : undefined;
      // A 402 already triggers the global CreditGate modal (mounted in
      // layout.tsx) via the resumeefy:credits-needed event dispatched
      // inside api() — no need to handle that case here too.
      if (code !== "INSUFFICIENT_CREDITS") {
        alert(e instanceof Error ? e.message : "Could not issue certificate");
      }
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/courses" className="text-xs font-bold text-[var(--ink-soft)]">
        ← All courses
      </Link>

      <div className="mt-4">
        <span className="section-label">{course.level.toUpperCase()} · {course.hours}</span>
        <h1 className="font-display text-3xl font-semibold mt-2">{course.title}</h1>
        <p className="text-[var(--ink-soft)] mt-2 max-w-2xl">{course.subtitle}</p>
      </div>

      <div className="instructor-card mt-6">
        <InstructorAvatar initials={instructor.initials} gradient={instructor.gradient} size={56} />
        <div>
          <div className="text-xs font-bold text-[var(--blue)]">YOUR INSTRUCTOR</div>
          <div className="font-semibold">{instructor.name} · <span className="font-normal text-[var(--ink-soft)]">{instructor.title}</span></div>
          <p className="text-sm mt-2 italic">"{instructor.greeting}"</p>
          <p className="text-xs text-[var(--ink-soft)] mt-2 max-w-xl">{instructor.bio}</p>
        </div>
      </div>

      <div className="course-progress-bar mt-6">
        <div style={{ width: `${(completedCount / course.lessons.length) * 100}%` }} />
      </div>
      <p className="text-xs text-[var(--ink-soft)] mt-2">
        {completedCount} of {course.lessons.length} lessons complete
      </p>

      <div className="course-grid mt-6">
        <aside className="course-lesson-nav">
          {course.lessons.map((l, i) => (
            <button
              key={l.id}
              className={`course-lesson-nav-item ${i === activeLesson ? "active" : ""} ${progress[l.id] ? "done" : ""}`}
              onClick={() => setActiveLesson(i)}
            >
              <span className="cln-check">{isLocked(i) ? "🔒" : progress[l.id] ? "✓" : i + 1}</span>
              <span>
                <b>{l.title}</b>
                <small>{isLocked(i) ? `${CREDIT_COSTS.course_lesson} credits` : `${l.minutes} min`}</small>
              </span>
            </button>
          ))}
        </aside>

        {isLocked(activeLesson) ? (
          <article className="card p-7 lesson-content lesson-locked">
            <CreditCoin size={40} />
            <h2 className="font-display text-2xl font-semibold mt-3">{lesson.title}</h2>
            <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-sm mx-auto">
              This lesson is locked. Unlock it for {CREDIT_COSTS.course_lesson} credits to keep going — the first lesson of every course is
              always free.
            </p>
            <button className="btn btn-primary mt-5" disabled={unlocking} onClick={() => unlockLesson(activeLesson)}>
              {unlocking ? "Unlocking…" : user ? `Unlock for ${CREDIT_COSTS.course_lesson} credits` : "Sign up to unlock"}
            </button>
          </article>
        ) : (
        <article className="card p-7 lesson-content">
          <h2 className="font-display text-2xl font-semibold">{lesson.title}</h2>
          <LessonNarrator paragraphs={lesson.body} voiceProfile={instructor.voiceProfile} gradient={instructor.gradient} />

          {lesson.tryThis && (
            <div className="try-this mt-6">
              <span className="text-xs font-bold text-[var(--blue)]">TRY THIS</span>
              <p className="mt-1">{lesson.tryThis}</p>
            </div>
          )}

          <div className="lesson-quiz mt-8">
            <span className="text-xs font-bold text-[var(--blue)]">CHECK YOUR UNDERSTANDING</span>
            <p className="font-semibold mt-2">{lesson.quiz.question}</p>
            <div className="grid gap-2 mt-3">
              {lesson.quiz.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectOpt = i === lesson.quiz.correct;
                let cls = "quiz-option";
                if (isSelected && isCorrectOpt) cls += " correct";
                else if (isSelected && !isCorrectOpt) cls += " wrong";
                return (
                  <button key={i} className={cls} onClick={() => checkAnswer(i)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answerState === "correct" && <p className="quiz-feedback correct">{lesson.quiz.explain}</p>}
            {answerState === "wrong" && <p className="quiz-feedback wrong">Not quite — try another option.</p>}
          </div>

          {answerState === "correct" && (
            <div className="mt-8">
              <span className="text-xs font-bold text-[var(--blue)]">PRACTICE WHAT YOU LEARNED</span>
              {lesson.id === "bullets" ? (
                <div className="mt-3">
                  <BulletBootcampGame />
                </div>
              ) : (
                <div className="practice-nudge mt-3">
                  <p>Reading is one thing — the interview simulator has a hands-on task that uses skills from this lesson.</p>
                  <Link href="/assessment" className="btn-sm mt-2 inline-flex">
                    Try the interview simulator →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button className="btn btn-ghost" disabled={activeLesson === 0} onClick={() => setActiveLesson((v) => v - 1)}>
              ← Previous lesson
            </button>
            <button
              className="btn btn-primary"
              disabled={activeLesson === course.lessons.length - 1}
              onClick={() => setActiveLesson((v) => v + 1)}
            >
              Next lesson →
            </button>
          </div>
        </article>
        )}
      </div>

      {allComplete && (
        <div className="card p-7 mt-8 text-center course-complete-card">
          <span className="text-xs font-bold text-[var(--blue)]">COURSE COMPLETE</span>
          <h2 className="font-display text-2xl font-semibold mt-2">You finished {course.title}.</h2>
          <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-lg mx-auto">
            Claim a certificate to show you completed this course.
          </p>
          {certState === "done" && certificateId ? (
            <p className="mt-4 font-bold text-[var(--mint)]">Certificate issued: {certificateId}</p>
          ) : certState === "signin" ? (
            <Link href={`/signup?next=/courses/${course.slug}`} className="btn btn-primary mt-4 inline-flex">
              Create a free account to claim it
            </Link>
          ) : (
            <button className="btn btn-primary mt-4" disabled={certState === "loading"} onClick={claimCertificate}>
              {certState === "loading" ? "Issuing…" : `Claim certificate · ${CREDIT_COSTS.course_certificate} credits`}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
