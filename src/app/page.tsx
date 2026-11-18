"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import "./landing.css";

const ICONS: Record<string, string[]> = {
  scan: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5", "M10.5 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M12.4 15.4 15 18"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 12h.01"],
  chat: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"],
  pulse: ["M3 12h4l3-8 4 16 3-8h4"],
  grid: ["M4 4h16v16H4z", "M8 8h8", "M8 12h3", "M8 16h3", "M15 12h1", "M15 16h1"],
  monitor: ["M3 4h18v12H3z", "M8 20h8", "M12 16v4"],
  spark: ["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z", "M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"],
  award: ["M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M8.2 13.9 7 22l5-3 5 3-1.2-8.1"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
  check: ["M5 13l4 4L19 7"],
  mail: ["M4 6h16v12H4z", "M4 7l8 6 8-6"],
  star: ["M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"],
};

function Icon({ name, size = 22, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={fill ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

type Tool = { title: string; text: string; href: string; icon: string; tone: string; lead?: "meter" | "chat" };

const tools: Tool[] = [
  { title: "Resume Analyzer", text: "See what weakens your CV and which lines to fix before you apply.", href: "/resume-analyzer", icon: "scan", tone: "blue", lead: "meter" },
  { title: "Mock Interviews", text: "Practise realistic questions until your answers sound clear and confident.", href: "/assessment", icon: "chat", tone: "gold", lead: "chat" },
  { title: "JD Matching", text: "Check how closely your resume speaks to the role you want.", href: "/resume-analyzer", icon: "target", tone: "ink" },
  { title: "Behavioral Scoring", text: "Get structured feedback on clarity, judgement and workplace thinking.", href: "/assessment", icon: "pulse", tone: "blue" },
  { title: "Aptitude Tests", text: "Sharpen verbal and quantitative reasoning under real time pressure.", href: "/assessment", icon: "grid", tone: "gold" },
  { title: "Desktop Simulation", text: "Prove you can handle the everyday digital tasks modern roles demand.", href: "/assessment", icon: "monitor", tone: "ink" },
  { title: "AI Feedback", text: "Turn every attempt into specific improvements you can act on.", href: "/assessment", icon: "spark", tone: "blue" },
  { title: "Readiness Certificate", text: "Finish with a shareable signal that you prepared seriously.", href: "/assessment", icon: "award", tone: "gold" },
];

const marquee = ["Resume Analyzer", "Mock Interviews", "Aptitude Tests", "Desktop Simulation", "JD Matching", "AI Feedback", "Resume Builder", "Readiness Certificate"];

const fixes = [
  { before: "Responsible for sales", after: "Grew monthly sales 34% across 3 regions", weak: "Vague", good: "Specific" },
  { before: "Worked with a team", after: "Led 6 people to deliver 12 client projects", weak: "No result", good: "Proof" },
  { before: "Good communication skills", after: "Presented weekly reports to 40+ stakeholders", weak: "Cliche", good: "Evidence" },
];
const SCORES = [38, 55, 71, 86, 92];

const steps = [
  { title: "Check your CV", text: "Upload your resume, paste a job description and see your score with the exact lines to fix.", href: "/resume-analyzer", cta: "Analyze my resume" },
  { title: "Practise for the room", text: "Run mock interviews, aptitude tests and a desktop simulation. Every attempt is scored with feedback.", href: "/assessment", cta: "Start the assessment" },
  { title: "Apply with proof", text: "Download an ATS-ready resume and a readiness certificate that shows you prepared.", href: "/resume-builder", cta: "Build my resume" },
];

const reduceMotion = "(prefers-reduced-motion: reduce)";

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia(reduceMotion).matches) return;
    el.textContent = `0${suffix}`;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1300);
        el.textContent = `${Math.round(to * (1 - Math.pow(1 - k, 3)))}${suffix}`;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix]);
  return <span ref={ref}>{to}{suffix}</span>;
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify({ email, source: "newsletter" }) });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="lp-panel" data-reveal="right" style={{ ["--i" as string]: 1 }}>
      <Icon name="mail" size={30} />
      <h2>Job alerts and career tips, weekly.</h2>
      <p>New openings, resume and interview tips, and product updates. One useful email, no spam. Unsubscribe any time.</p>
      {status === "done" ? (
        <p className="lp-note">You are in. Check your inbox soon.</p>
      ) : (
        <>
          <form onSubmit={submit} className="lp-form">
            <input type="email" required placeholder="you@email.com" aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button disabled={status === "sending"}>{status === "sending" ? "Joining..." : "Subscribe"}</button>
          </form>
          {status === "error" && <p className="lp-note err">That did not go through. Check your email and try again.</p>}
        </>
      )}
    </div>
  );
}

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);

  // Hero loop: each phase fixes one weak line, then holds on the final score.
  useEffect(() => {
    if (window.matchMedia(reduceMotion).matches) {
      const t = window.setTimeout(() => setPhase(4), 0);
      return () => window.clearTimeout(t);
    }
    let t = 0;
    const tick = (p: number) => {
      setPhase(p);
      t = window.setTimeout(() => tick(p >= 4 ? 0 : p + 1), p === 4 ? 3400 : 1500);
    };
    t = window.setTimeout(() => tick(1), 1200);
    return () => window.clearTimeout(t);
  }, []);

  // Scroll reveal, scroll progress bar, hero parallax and the steps connector.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia(reduceMotion).matches;
    if (!reduced) root.classList.add("is-ready");

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add("is-in");
        window.setTimeout(() => el.classList.add("is-done"), 1300);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => io.observe(el));

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (cvRef.current && !reduced) cvRef.current.style.setProperty("--hy", `${Math.min(y, 800) * -0.07}px`);
      const s = stepsRef.current;
      if (s) {
        const r = s.getBoundingClientRect();
        const p = (window.innerHeight * 0.7 - r.top) / (r.height + window.innerHeight * 0.1);
        s.style.setProperty("--p", String(Math.max(0, Math.min(1, p))));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const idx = (i: number) => ({ ["--i" as string]: i });

  return (
    <main id="main-content" className="lp" ref={rootRef}>
      <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap" />
      <div className="lp-progress" ref={barRef} aria-hidden="true" />

      <section className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div>
            <h1>
              <span className="ln" style={idx(0)}><span>Your CV gets one look.</span></span>
              <span className="ln" style={idx(1)}><span>Make it count.</span></span>
            </h1>
            <p className="lp-sub">Resumeefy scores your resume, drills you with mock interviews and aptitude tests, and shows exactly what to fix before you apply.</p>
            <div className="lp-actions">
              <Link href="/assessment" className="lp-btn lp-btn-gold">Start free assessment <Icon name="arrow" size={18} /></Link>
              <Link href="/resume-builder" className="lp-btn lp-btn-glass">Build your resume</Link>
            </div>
            <ul className="lp-points">
              <li><Icon name="check" size={16} /> Free to start</li>
              <li><Icon name="check" size={16} /> ATS-ready resumes</li>
              <li><Icon name="check" size={16} /> Feedback on every attempt</li>
            </ul>
          </div>

          <div className="lp-stage" aria-label="A resume being improved and scored in real time">
            <div className={`lp-cv ${phase === 4 ? "is-done" : ""}`} ref={cvRef}>
              <div className="lp-cv-head">
                <div className="lp-av">CE</div>
                <div className="lp-who"><b>Chioma Eze</b><span>Sales and Operations</span></div>
                <div className="lp-score">
                  <strong>{SCORES[phase]}</strong> <small>/100</small>
                  <div className="lp-bar"><i style={{ width: `${SCORES[phase]}%` }} /></div>
                </div>
              </div>
              {fixes.map((f, i) => (
                <div key={f.before} className={`lp-row ${phase > i && phase >= 1 ? "is-fixed" : ""}`}>
                  <div className="lp-old">{f.before}</div>
                  <div className="lp-new"><span>{f.after}</span></div>
                  <span className="lp-tag weak">{f.weak}</span>
                  <span className="lp-tag good">{f.good}</span>
                </div>
              ))}
              <div className="lp-skills"><span>Excel</span><span>CRM</span><span>Reporting</span><span>Negotiation</span></div>
              <div className="lp-ats"><Icon name="check" size={16} /> ATS-ready</div>
            </div>
            <div className="lp-chip one"><b>+24%</b><small>keyword match</small></div>
            <div className="lp-chip two"><b>3 fixes</b><small>applied in seconds</small></div>
          </div>
        </div>
      </section>

      <section className="lp-marquee" aria-label="What Resumeefy covers">
        <div className="lp-track">
          {[0, 1].map((n) => (
            <div key={n} style={{ display: "flex" }} aria-hidden={n === 1}>
              {marquee.map((m) => <span key={`${n}-${m}`}>{m}<Icon name="star" size={16} fill /></span>)}
            </div>
          ))}
        </div>
      </section>

      <section id="tools" className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-head" data-reveal>
            <h2>Eight ways to get ready for the job you want.</h2>
            <p>From your first CV review to the final interview, every tool feeds the next one, so you always know what to work on.</p>
          </div>
          <div className="lp-bento">
            {tools.map((t, i) => (
              <Link href={t.href} key={t.title} className={`lp-tool ${t.lead ? "lead" : ""}`} data-reveal={t.lead ? "left" : undefined} style={idx(t.lead ? 0 : i % 3)}>
                <span className={`lp-ico ${t.tone === "blue" ? "" : t.tone}`}><Icon name={t.icon} /></span>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                {t.lead === "meter" && (
                  <div className="lp-meter" aria-hidden="true">
                    {[["Keywords", 86], ["Formatting", 92], ["Impact", 64]].map(([label, v], j) => (
                      <div key={label} className={`lp-m ${v === 64 ? "weak" : ""}`} style={{ ["--i" as string]: j, ["--w" as string]: `${v}%` }}><span>{label}</span><i /><b>{v}%</b></div>
                    ))}
                  </div>
                )}
                {t.lead === "chat" && (
                  <div className="lp-chat" aria-hidden="true">
                    <div className="lp-b q">Tell me about a time you handled a difficult customer.</div>
                    <div className="lp-b a">I listened first, then fixed the billing error within a day.</div>
                    <div className="lp-typing"><span /><span /><span /></div>
                  </div>
                )}
                <span className="lp-go">Open <Icon name="arrow" size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec lp-how">
        <div className="lp-wrap">
          <div className="lp-head" data-reveal>
            <h2>Three steps from draft CV to confident applicant.</h2>
            <p>Work through them in order, or jump to the one you need today.</p>
          </div>
          <div className="lp-steps" ref={stepsRef}>
            {steps.map((s, i) => (
              <div className="lp-step" key={s.title} data-reveal style={idx(i)}>
                <div className="lp-no">{i + 1}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <Link href={s.href} className="lp-go">{s.cta} <Icon name="arrow" size={16} /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec lp-sim">
        <div className="lp-wrap lp-sim-grid">
          <div className="lp-video" data-reveal="left">
            <video controls playsInline preload="metadata" poster="/brand/resumeefy-wordmark.png" aria-label="Resumeefy desktop simulation demonstration">
              <source src="/media/desktop-simulation-demo.mp4" type="video/mp4" />
            </video>
          </div>
          <div data-reveal="right">
            <h2>Not just questions. Real work, simulated.</h2>
            <p className="lead">Your assessment can put you inside a browser, inbox and spreadsheet workflow. Read the task, open each app yourself and complete the steps.</p>
            <ol className="lp-list">
              <li><b>1</b><div><strong>Read the brief</strong><span>Understand the outcome before you touch the tools.</span></div></li>
              <li><b>2</b><div><strong>Open the right app</strong><span>Chrome, Mail and Sheets are clearly labelled.</span></div></li>
              <li><b>3</b><div><strong>Finish the workflow</strong><span>Accuracy, judgement and time all count.</span></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-head" data-reveal>
            <h2>Preparation should feel like progress.</h2>
            <p>Stop guessing whether you are ready. See the gaps, practise the skill and measure the improvement.</p>
          </div>
          <div className="lp-why">
            {[
              ["target", "Realistic practice", "Questions and tasks that look like the real thing, not generic tips."],
              ["spark", "Clear feedback", "Specific notes after every attempt, so the next one is better."],
              ["award", "One connected path", "Your CV, interview and assessment results live in one place."],
            ].map(([icon, title, text], i) => (
              <div className="lp-why-card" key={title} data-reveal="zoom" style={idx(i)}>
                <span className={`lp-ico ${["", "gold", "ink"][i]}`}><Icon name={icon} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="lp-partner" data-reveal="zoom">
            <div>
              <h2>Have a career audience? Turn it into income.</h2>
              <p>Refer people who want stronger resumes and sharper interviews. Partners get a personal referral code, a 60 day attribution window and 40% commission on qualifying credit purchases.</p>
              <div className="lp-actions">
                <Link href="/refer" className="lp-btn lp-btn-gold">Join the partner program <Icon name="arrow" size={18} /></Link>
                <Link href="/refer" className="lp-btn lp-btn-glass">Already a partner?</Link>
              </div>
            </div>
            <div className="lp-stats">
              <div className="lp-stat"><b><CountUp to={40} suffix="%" /></b><span>commission on credit purchases</span></div>
              <div className="lp-stat"><b><CountUp to={60} /></b><span>day attribution window</span></div>
              <div className="lp-stat"><b><CountUp to={1} /></b><span>dashboard for your referrals</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="lp-sec" style={{ paddingTop: 0 }}>
        <div className="lp-wrap lp-duo">
          <div className="lp-panel blue" data-reveal="left">
            <Image src="/brand/resumeefy-mark.png" alt="" width={52} height={42} />
            <h2>Stay close to the opportunities.</h2>
            <p>Join the Resumeefy WhatsApp community for job search guidance, interview questions, useful resources and new openings.</p>
            <a href="https://chat.whatsapp.com/resumeefy-community" target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-gold">Join the community <Icon name="arrow" size={18} /></a>
          </div>
          <Newsletter />
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap" data-reveal="zoom">
          <h2>Your next application starts here.</h2>
          <p>Start free. Find the gaps. Build the confidence. Make the next application count.</p>
          <div className="lp-actions">
            <Link href="/assessment" className="lp-btn lp-btn-gold">Start free assessment <Icon name="arrow" size={18} /></Link>
            <Link href="/resume-builder" className="lp-btn lp-btn-glass">Build your resume</Link>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">
          <div className="lp-foot-grid">
            <div className="lp-foot-brand">
              <div className="lp-logo"><Image src="/brand/resumeefy-mark.png" alt="" width={34} height={27} /> Resumeefy</div>
              <p>Better CV. Bigger Opportunities.</p>
            </div>
            <div>
              <h4>Tools</h4>
              <ul>
                <li><Link href="/assessment">Interview Prep</Link></li>
                <li><Link href="/resume-builder">Resume Builder</Link></li>
                <li><Link href="/resume-analyzer">Resume Analyzer</Link></li>
              </ul>
            </div>
            <div>
              <h4>Learn and earn</h4>
              <ul>
                <li><Link href="/courses">Courses</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/invite">Invite and Earn</Link></li>
                <li><Link href="/refer">Partner Program</Link></li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li><Link href="/login">Log in</Link></li>
                <li><Link href="/signup">Sign up free</Link></li>
                <li><a href="#community">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-copy">© 2026 Resumeefy. Built for ambitious job seekers.</div>
        </div>
      </footer>
    </main>
  );
}
