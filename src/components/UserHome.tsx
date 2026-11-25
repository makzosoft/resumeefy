import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import HomeWallet from "@/components/HomeWallet";
import CertificateList from "@/components/CertificateList";
import { getUserCertificates } from "@/lib/certificates";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import { getCourseCertificates, getCourses, getCreditBalance, getLatestResume, getUserAssessments, getUserInviteProfile } from "@/lib/data";
import type { SessionPayload } from "@/lib/auth";
import "@/app/landing.css";
import "@/app/userhome.css";

const ICONS: Record<string, string[]> = {
  chat: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"],
  grid: ["M4 4h16v16H4z", "M8 8h8", "M8 12h3", "M8 16h3", "M15 12h1", "M15 16h1"],
  scan: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5", "M10.5 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M12.4 15.4 15 18"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 12h.01"],
  book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  news: ["M4 5h16v14H4z", "M8 9h8", "M8 13h8", "M8 17h4"],
  gift: ["M20 12v9H4v-9", "M2 7h20v5H2z", "M12 22V7", "M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z", "M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"],
};
function Ico({ name }: { name: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name].map((d) => <path key={d} d={d} />)}</svg>;
}

const greeting = () => {
  const h = new Date(Date.now() + 3600000).getUTCHours(); // Lagos time
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const when = (d?: string | null) => {
  if (!d) return "";
  const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  return m < 60 ? "just now" : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};

export default async function UserHome({ session }: { session: SessionPayload }) {
  const id = session.sub;
  const [wallet, assessments, resume, courses, certs, invite, certInfos] = await Promise.all([
    getCreditBalance(id).catch(() => null),
    getUserAssessments(id).catch(() => [] as any[]),
    getLatestResume(id).catch(() => undefined),
    getCourses(id).catch(() => [] as any[]),
    getCourseCertificates(id).catch(() => [] as any[]),
    getUserInviteProfile(id).catch(() => undefined),
    getUserCertificates(id, session.name || "").catch(() => []),
  ]);

  const first = (session.name || "").split(" ")[0] || "there";
  const latest = assessments[0] as { overall_score?: number; completed_at?: string } | undefined;
  const steps = [
    { done: assessments.length > 0, title: "Take your first assessment", sub: "See where you stand today", href: "/assessment" },
    { done: !!resume, title: "Build or check your resume", sub: "Get an ATS ready resume and a score", href: "/resume-analyzer" },
    { done: courses.length > 0, title: "Start a course", sub: "Learn the skills your role needs", href: "/courses" },
    { done: certs.length > 0, title: "Earn a certificate", sub: "Finish a course and show your progress", href: "/courses" },
  ];
  const doneN = steps.filter((s) => s.done).length;

  const tools = [
    { t: "Mock interview", d: "Practise real questions and get feedback after every answer.", href: "/assessment", ico: "chat", tone: "", cost: `From ${CREDIT_COSTS.interview} credits` },
    { t: "Aptitude and simulation", d: "Timed tests and real workplace tasks, scored for you.", href: "/assessment", ico: "grid", tone: "gold", cost: `From ${CREDIT_COSTS.assessment_module} credits` },
    { t: "Resume analyzer", d: "Find what weakens your resume and which lines to fix.", href: "/resume-analyzer", ico: "scan", tone: "ink", cost: `${CREDIT_COSTS.resume_quality} credits` },
    { t: "Resume builder", d: "Create an ATS ready resume with AI help.", href: "/resume-builder", ico: "edit", tone: "", cost: `From ${CREDIT_COSTS.resume_ai} credits` },
    { t: "Job match", d: "Check how well your resume fits a job description.", href: "/resume-analyzer", ico: "target", tone: "gold", cost: `${CREDIT_COSTS.job_match} credits` },
    { t: "Courses", d: "Role focused courses with quizzes and certificates.", href: "/courses", ico: "book", tone: "ink", cost: `${CREDIT_COSTS.course_generation} credits to create` },
    { t: "Career blog", d: "Practical resume, interview and job search advice.", href: "/blog", ico: "news", tone: "", cost: "Free", free: true },
    { t: "Invite and earn", d: "Share your code. You both get free credits.", href: "/invite", ico: "gift", tone: "gold", cost: "Free credits", free: true },
  ];

  return (
    <main id="main-content" className="lp uh">
      <section className="uh-hero">
        <div className="lp-wrap uh-top">
          <div>
            <span className="uh-hi">{greeting()}</span>
            <h1>Hi {first}, what are we working on?</h1>
            <p>{doneN === steps.length ? "You have done the full path. Keep practising to stay sharp." : "Pick up where you left off or start something new. Everything you need is below."}</p>
          </div>
          <div className="uh-wallet">
            <div><HomeWallet initial={wallet ? wallet.balance : null} /><span>credits available</span></div>
            <Link href="/shop" className="uh-btn">Get credits</Link>
          </div>
        </div>
      </section>

      <div className="lp-wrap uh-body">
        <section className="uh-card">
          <h2>Your path to ready</h2>
          <p className="uh-sub">{doneN} of {steps.length} steps done. Follow them in order or jump to any one.</p>
          <div className="uh-bar" aria-hidden="true"><i style={{ width: `${(doneN / steps.length) * 100}%` }} /></div>
          <div className="uh-steps">
            {steps.map((s, i) => (
              <Link key={s.title} href={s.href} className={`uh-step${s.done ? " done" : ""}`}>
                <span className="uh-dot">{s.done ? "✓" : i + 1}</span>
                <span><b>{s.title}</b><span className="s">{s.sub}</span></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="uh-card">
          <h2>What do you want to do?</h2>
          <p className="uh-sub">Credits are only used when you run a tool. Browsing is always free.</p>
          <div className="uh-grid">
            {tools.map((x, i) => (
              <Link key={x.t} href={x.href} className="uh-tool" style={{ ["--i" as string]: i }}>
                <span className={`uh-ico ${x.tone}`}><Ico name={x.ico} /></span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
                <span className={`uh-cost${x.free ? " free" : ""}`}>{x.cost}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="uh-card" id="certificates">
          <h2>Your certificates</h2>
          <p className="uh-sub">{certInfos.length ? "View, download or share any certificate whenever you like. Sharing on LinkedIn also tells people about Resumeefy." : "Finish a course to earn your first certificate. You can download it and share it on LinkedIn."}</p>
          {certInfos.length ? <CertificateList certs={certInfos} /> : <Link href="/courses" className="uh-btn blue" style={{ marginTop: 14 }}>Browse courses</Link>}
        </section>

        <div className="uh-row">
          <section className="uh-card">
            <h2>Your progress</h2>
            <div className="uh-stats">
              <div className="uh-stat"><b>{latest ? latest.overall_score : "-"}</b><span>{latest ? `Latest score, ${when(latest.completed_at)}` : "No assessment yet"}</span></div>
              <div className="uh-stat"><b>{assessments.length}</b><span>Assessments taken</span></div>
              <div className="uh-stat"><b>{resume ? (resume.is_unlocked ? "Unlocked" : "Draft") : "None"}</b><span>{resume ? `Resume, edited ${when(resume.updated_at)}` : "No resume yet"}</span></div>
              <div className="uh-stat"><b>{courses.length}</b><span>Courses, {certs.length} certificate{certs.length === 1 ? "" : "s"}</span></div>
            </div>
          </section>
          <section className="uh-card uh-invite">
            <h2>Earn free credits</h2>
            <p>Share your invite code. When a friend joins, you both get credits.</p>
            {invite?.invite_code ? <code>{invite.invite_code}</code> : null}
            <Link href="/invite" className="uh-btn">Invite friends</Link>
            {session.role === "admin" && <Link href="/admin" className="uh-btn blue">Open admin</Link>}
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
