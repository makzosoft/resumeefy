"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, CurrentUser, track } from "@/lib/client";
import { CURATED_COURSES, INSTRUCTORS } from "@/lib/courses-content";
import { InstructorAvatar } from "@/components/InstructorAvatar";

const starterPaths = [
  { title: "Data Analyst Launchpad", role: "Data Analyst", desc: "Excel, SQL, dashboards, analysis and portfolio proof." },
  { title: "Product Manager Launchpad", role: "Product Manager", desc: "Product thinking, discovery, prioritisation, metrics and case practice." },
  { title: "Digital Marketing Launchpad", role: "Digital Marketer", desc: "Content, campaigns, analytics, growth and practical projects." },
  { title: "Graduate Career Starter", role: "Graduate / Entry Level", desc: "Workplace fundamentals, communication, tools and interview readiness." },
];

function CuratedCourseCard({ course }: { course: (typeof CURATED_COURSES)[number] }) {
  const instructor = INSTRUCTORS[course.instructorId];
  return (
    <Link href={`/courses/${course.slug}`} className="card course-card hover:-translate-y-1 transition-transform">
      <div className="course-card-top" style={{ background: `linear-gradient(135deg,${instructor.gradient[0]},${instructor.gradient[1]})` }}>
        <InstructorAvatar initials={instructor.initials} gradient={instructor.gradient} size={44} />
        <div className="text-white">
          <div className="text-xs opacity-80 font-bold">{instructor.name}</div>
          <div className="text-xs opacity-70">{instructor.title}</div>
        </div>
      </div>
      <div className="course-card-body">
        <div className="text-xs font-bold text-[var(--blue)] mt-4">{course.level.toUpperCase()} · {course.hours}</div>
        <h3 className="font-display text-xl font-semibold mt-2">{course.title}</h3>
        <p className="text-sm text-[var(--ink-soft)] mt-2">{course.subtitle}</p>
        <ul className="course-card-outcomes">
          {course.outcomes.slice(0, 3).map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <span className="text-sm font-bold inline-block mt-5">Start course →</span>
      </div>
    </Link>
  );
}

export default function Courses() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [resume, setResume] = useState<any>(undefined);
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [certs, setCerts] = useState<Record<string, string>>({});
  const [projectText, setProjectText] = useState<Record<string, string>>({});

  useEffect(() => {
    api<any>("/api/auth").then((r) => {
      setUser(r.user);
      if (r.user) api<any>("/api/resume?latest=1").then((x) => setResume(x.data)).catch(() => {});
    });
  }, []);

  async function generate() {
    if (!user) return (location.href = "/signup?next=/courses");
    setLoading(true);
    try {
      const r = await api<any>("/api/ai?action=course", {
        method: "POST",
        body: JSON.stringify({ action: "course", targetRole: role, jobDescription: jd || undefined, resume }),
      });
      setCourses((c) => [{ id: r.id, ...r.course }, ...c]);
      track("course_opened", { courseId: r.id });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Could not generate course";
      if (m.includes("credits")) location.href = "/shop";
      else alert(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-14">
      <div className="text-center">
        <span className="section-label">RESUMEEFY COURSES</span>
        <h1 className="font-display text-4xl font-semibold mt-2">Courses built to actually finish.</h1>
        <p className="text-[var(--ink-soft)] mt-3 max-w-2xl mx-auto">
          Real, in-depth lessons written by instructors with real hiring and workplace experience — free to study,
          start to finish, no waiting on AI generation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        {CURATED_COURSES.map((c) => (
          <CuratedCourseCard key={c.slug} course={c} />
        ))}
      </div>

      <section className="mt-16 pt-12 border-t border-[var(--line)]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="section-label">ALSO AVAILABLE</span>
            <h2 className="font-display text-2xl font-semibold mt-1">Build a personalized path with AI</h2>
            <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-xl">
              Prefer something tailored to one specific role or job description? Resumeefy can generate a custom
              course with modules, quizzes and a project, built around your resume and target role.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowGenerator((v) => !v)}>
            {showGenerator ? "Hide" : "Generate a personalized course"}
          </button>
        </div>

        {showGenerator && (
          <>
            <div className="card p-6 mt-6 max-w-3xl">
              <input className="input" placeholder="Target role, e.g. Data Analyst" value={role} onChange={(e) => setRole(e.target.value)} />
              <textarea className="input min-h-[120px] mt-3" placeholder="Paste job description (optional)" value={jd} onChange={(e) => setJd(e.target.value)} />
              <button className="btn btn-primary mt-4" disabled={loading || role.trim().length < 2} onClick={() => void generate()}>
                {loading ? "Designing your course…" : "Create personalized course · 25 credits"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {starterPaths.map((path) => (
                <button
                  key={path.role}
                  className="card p-5 text-left hover:-translate-y-1 transition-transform"
                  onClick={() => {
                    setRole(path.role);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <div className="text-xs font-bold text-[var(--blue)]">AI PATH</div>
                  <h3 className="font-display text-lg font-semibold mt-2">{path.title}</h3>
                  <p className="text-xs text-[var(--ink-soft)] mt-2">{path.desc}</p>
                  <span className="text-xs font-bold inline-block mt-4">Personalise this →</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {courses.map((c) => (
            <article key={c.id} className="card overflow-hidden">
              <div className="h-36 bg-[radial-gradient(circle_at_30%_20%,#9ee9ff,transparent_35%),linear-gradient(135deg,#07162e,#0d4b72)] p-6 text-white">
                <div className="text-xs uppercase tracking-widest opacity-70">{c.difficulty}</div>
                <h2 className="font-display text-2xl font-semibold mt-2">{c.title}</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-[var(--ink-soft)]">{c.description}</p>
                <div className="mt-5 space-y-3">
                  {c.modules?.map((m: any, i: number) => (
                    <div key={i} className="rounded-xl bg-[var(--paper-dim)] p-4">
                      <div className="text-xs font-bold">MODULE {i + 1}</div>
                      <h3 className="font-semibold mt-1">{m.title}</h3>
                      <p className="text-xs mt-1">{m.objective}</p>
                      <p className="text-xs mt-2">
                        <b>Project:</b> {m.project} · submit within {m.deadlineDays} days
                      </p>
                      {m.quiz?.map((q: any, qi: number) => (
                        <div key={qi} className="mt-3">
                          <div className="text-xs font-bold">CHECK YOURSELF</div>
                          <p className="text-sm font-semibold mt-1">{q.question}</p>
                          <div className="grid gap-1 mt-2">
                            {q.options.map((o: string, oi: number) => (
                              <button
                                key={oi}
                                className={`text-left text-xs rounded-lg border p-2 ${
                                  quizAnswers[`${c.id}-${i}-${qi}`] === oi
                                    ? oi === q.answer
                                      ? "border-[var(--mint)] bg-[var(--mint)]/10"
                                      : "border-red-400 bg-red-50"
                                    : "border-[var(--line)]"
                                }`}
                                onClick={() => setQuizAnswers((x) => ({ ...x, [`${c.id}-${i}-${qi}`]: oi }))}
                              >
                                {o}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  {c.modules?.map((m: any, i: number) => (
                    <div key={`submit-${i}`} className="rounded-xl border border-[var(--line)] p-4">
                      <div className="text-xs font-bold">PROJECT SUBMISSION</div>
                      <textarea
                        className="input mt-2 min-h-[90px]"
                        placeholder="Paste your project response or submission link..."
                        value={projectText[`${c.id}-${i}`] || ""}
                        onChange={(e) => setProjectText((x) => ({ ...x, [`${c.id}-${i}`]: e.target.value }))}
                      />
                      <button
                        className="btn btn-primary mt-2"
                        onClick={() =>
                          api("/api/assessment", {
                            method: "POST",
                            body: JSON.stringify({
                              action: "course_submit",
                              courseId: c.id,
                              submissionText: projectText[`${c.id}-${i}`] || "",
                              deadlineAt: new Date(Date.now() + m.deadlineDays * 86400000).toISOString(),
                            }),
                          })
                            .then(() => setSubmitted((x) => ({ ...x, [`${c.id}-${i}`]: true })))
                            .catch((e) => alert(e.message))
                        }
                      >
                        {submitted[`${c.id}-${i}`] ? "Submitted ✓" : "Submit project"}
                      </button>
                      <button
                        className="btn btn-ghost ml-2 mt-2"
                        onClick={() =>
                          api("/api/assessment", { method: "POST", body: JSON.stringify({ action: "course_late_unlock", courseId: c.id }) })
                            .then(() => alert("Course unlocked. Continue from this project."))
                            .catch((e) => alert(e.message))
                        }
                      >
                        Missed deadline? Unlock · 20 credits
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      api<any>("/api/assessment", { method: "POST", body: JSON.stringify({ action: "course_certificate", courseId: c.id }) })
                        .then((r) => setCerts((x) => ({ ...x, [c.id]: r.certificateId })))
                        .catch((e) => alert(e.message))
                    }
                  >
                    Get course certificate · {c.certificateRequiredCredits || 40} credits
                  </button>
                  {certs[c.id] && <span className="rounded-full bg-[var(--mint)]/15 px-4 py-2 text-sm font-bold">Certificate {certs[c.id]}</span>}
                </div>
                <p className="text-xs mt-3 text-[var(--ink-soft)]">
                  Course study: free · Course certificate: {c.certificateRequiredCredits || 40} credits · Certificate of Readiness: free
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
