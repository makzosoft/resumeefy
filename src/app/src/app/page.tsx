"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const modules = [
  { no: "01", title: "Resume Analyzer", text: "See what weakens your CV and what deserves attention before you apply.", href: "/resume-analyzer", tone: "blue" },
  { no: "02", title: "JD Matching", text: "Understand how closely your resume speaks to the role you actually want.", href: "/resume-analyzer", tone: "cyan" },
  { no: "03", title: "Mock Interviews", text: "Practice realistic questions until your answers sound clear and confident.", href: "/assessment", tone: "gold" },
  { no: "04", title: "Behavioral Scoring", text: "Get structured feedback on clarity, judgement and workplace thinking.", href: "/assessment", tone: "blue" },
  { no: "05", title: "Aptitude Tests", text: "Sharpen verbal and quantitative reasoning under realistic time pressure.", href: "/assessment", tone: "cyan" },
  { no: "06", title: "Desktop Simulation", text: "Prove you can handle the everyday digital tasks modern roles demand.", href: "/assessment", tone: "gold" },
  { no: "07", title: "AI Feedback", text: "Turn every attempt into specific, useful improvements you can act on.", href: "/assessment", tone: "blue" },
  { no: "08", title: "Readiness Certificate", text: "Finish with a shareable signal that you took preparation seriously.", href: "/assessment", tone: "cyan" },
];

const scenes = [
  { eyebrow: "01 / PRACTICE", title: "Build confidence before the room.", metric: "78%", label: "Interview readiness", bars: [82, 68, 91] },
  { eyebrow: "02 / IMPROVE", title: "Know exactly what to fix.", metric: "92%", label: "Resume strength", bars: [92, 78, 86] },
  { eyebrow: "03 / MOVE", title: "Walk into the opportunity prepared.", metric: "READY", label: "Next step unlocked", bars: [96, 94, 98] },
];

export default function Home() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setScene((s) => (s + 1) % scenes.length), 4600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".home-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main id="main-content" className="site-main">
      <section className="brand-hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-grid" />
        <div className="max-w-6xl mx-auto px-6 hero-inner">
          <div className="hero-copy">
            <div className="brand-kicker"><span className="pulse-dot" /> BETTER CV. BIGGER OPPORTUNITIES.</div>
            <h1>Prepare with intention. <em>Show up ready.</em></h1>
            <p>Resumeefy brings resume improvement, interview practice, aptitude tests and workplace simulations into one polished career readiness experience.</p>
            <div className="hero-actions">
              <Link href="/assessment" className="brand-btn brand-btn-gold">Start free assessment <span>↗</span></Link>
              <Link href="/resume-builder" className="brand-btn brand-btn-outline">Build your resume <span>→</span></Link>
            </div>
            <div className="hero-meta">
              <div><strong>08</strong><span>readiness modules</span></div>
              <div><strong>01</strong><span>connected career system</span></div>
              <div><strong>FREE</strong><span>to start</span></div>
            </div>
          </div>

          <div className="hero-visual-wrap" aria-label="Resumeefy readiness preview">
            <div className="hero-visual">
              <div className="visual-glow" />
              <div className="visual-window">
                <div className="visual-topbar">
                  <div className="visual-brand"><Image src="/brand/resumeefy-mark.png" alt="" width={26} height={21} /><span>Resumeefy</span></div>
                  <span className="visual-status"><i /> Live workspace</span>
                </div>
                <div className="visual-body">
                  <div className="visual-heading"><span>{scenes[scene].eyebrow}</span><h2>{scenes[scene].title}</h2></div>
                  <div className="readiness-card">
                    <div className="readiness-ring"><div><strong>{scenes[scene].metric}</strong><small>{scenes[scene].label}</small></div></div>
                    <div className="readiness-bars">
                      {scenes[scene].bars.map((bar, i) => <div className="readiness-row" key={i}><span>{["Confidence", "Clarity", "Role fit"][i]}</span><div><i style={{ width: `${bar}%` }} /></div><b>{bar}%</b></div>)}
                    </div>
                  </div>
                  <div className="visual-tasks">
                    <span><i /> Resume reviewed</span><span><i /> Interview practiced</span><span><i /> Assessment scored</span>
                  </div>
                  <div className="hero-human-card">
                    <Image src="/illustrations/assessment-coach.svg" alt="Resumeefy career coach" width={220} height={178} />
                    <div><b>Practice with confidence.</b><span>Your AI coach keeps every session focused.</span></div>
                  </div>
                </div>
                <div className="visual-bottom">
                  {scenes.map((_, i) => <button key={i} type="button" aria-label={`Show preview ${i + 1}`} aria-current={scene === i} onClick={() => setScene(i)}><i /></button>)}
                </div>
              </div>
            </div>
            <div className="floating-chip chip-one"><span>+24%</span><small>profile strength</small></div>
            <div className="floating-chip chip-two"><span>READY</span><small>next application</small></div>
          </div>
        </div>
      </section>

      <section className="brand-strip" aria-label="Resumeefy capabilities">
        <div className="brand-strip-track">{["Resume Analyzer", "Interview Practice", "Aptitude", "Workplace Simulation", "AI Feedback", "Career Readiness", "Resume Builder", "JD Matching", "Resume Analyzer", "Interview Practice"].map((x, i) => <span key={`${x}-${i}`}>{x}<b>✦</b></span>)}</div>
      </section>

      <section id="modules" className="max-w-6xl mx-auto px-6 section-space home-reveal">
        <div className="section-intro">
          <div><span className="section-label">THE SYSTEM</span><h2>Everything you need to get <em>chosen.</em></h2></div>
          <p>From your first CV review to the final interview, Resumeefy gives you a clear path to prepare, practice and improve.</p>
        </div>
        <div className="module-grid brand-module-grid">
          {modules.map((module) => <Link href={module.href} key={module.no} className="brand-module-card"><div className={`module-icon ${module.tone}`}><span>{module.no}</span></div><div className="module-card-content"><div className="module-top"><span>{module.no}</span><b>↗</b></div><h3>{module.title}</h3><p>{module.text}</p><span className="module-link">Explore module</span></div></Link>)}
        </div>
      </section>

      <section className="simulation-showcase home-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="simulation-intro">
            <div><span className="section-label">SEE IT IN ACTION</span><h2>Not just questions. <em>Real work, simulated.</em></h2></div>
            <p>Your assessment can put you inside a browser, inbox and spreadsheet workflow. Read the task first, then open each app yourself and complete the steps.</p>
          </div>
          <div className="simulation-video-card">
            <div className="video-frame"><video controls playsInline preload="metadata" poster="/brand/resumeefy-wordmark.png" aria-label="Resumeefy desktop simulation demonstration"><source src="/media/desktop-simulation-demo.mp4" type="video/mp4" /></video><div className="video-caption"><span>DESKTOP SIMULATION</span><strong>Open the app. Follow the brief. Make the right move.</strong></div></div>
            <div className="simulation-steps">
              <div><b>01</b><strong>Read the brief</strong><span>Understand the outcome before touching the tools.</span></div>
              <div><b>02</b><strong>Open the right app</strong><span>Chrome, Mail, Sheets and role relevant tools are clearly labelled.</span></div>
              <div><b>03</b><strong>Complete the workflow</strong><span>Accuracy, judgement and time all count.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="dark-feature-section home-reveal">
        <div className="max-w-6xl mx-auto px-6 dark-feature-grid">
          <div className="dark-feature-copy"><span className="section-label light">WHY RESUMEEFY</span><h2>Preparation should feel like <em>progress.</em></h2><p>Stop guessing whether you are ready. See the gaps, practise the skill, measure the improvement and move forward with evidence.</p><Link href="/assessment" className="brand-btn brand-btn-gold">Check your readiness <span>↗</span></Link></div>
          <div className="feature-stack">
            {["Realistic practice, not generic tips.", "Clear feedback after every attempt.", "One connected experience from CV to interview."].map((text, i) => <div className="feature-line" key={text}><span>0{i + 1}</span><p>{text}</p><i>↗</i></div>)}
          </div>
        </div>
      </section>

      <section className="affiliate-invite home-reveal">
        <div className="max-w-6xl mx-auto px-6">
          <div className="affiliate-invite-card">
            <div><span className="section-label light">RESUMEEFY PARTNER PROGRAM</span><h2>Have a career audience? <em>Turn influence into income.</em></h2><p>Refer people who want stronger resumes, sharper interviews and practical career preparation. Affiliates get a personal referral code, a 60 day attribution window and 40% commission on qualifying credit purchases.</p><div className="hero-actions"><Link href="/refer" className="brand-btn brand-btn-gold">Explore affiliate program <span>↗</span></Link><Link href="/refer" className="brand-btn brand-btn-outline-light">Already a partner? <span>→</span></Link></div></div>
            <div className="affiliate-orbit"><div className="orbit-ring orbit-ring-one"/><div className="orbit-ring orbit-ring-two"/><div className="orbit-core"><strong>40%</strong><span>commission</span></div><span className="orbit-pill orbit-pill-one">60 day tracking</span><span className="orbit-pill orbit-pill-two">Your code</span><span className="orbit-pill orbit-pill-three">Your dashboard</span></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 section-space home-reveal">
        <div className="community-card" id="community">
          <div className="community-mark"><Image src="/brand/resumeefy-mark.png" alt="" width={48} height={38} /></div>
          <div className="community-copy"><span className="section-label">THE COMMUNITY</span><h2>Stay close to the opportunities.</h2><p>Join the Resumeefy WhatsApp community for practical job search guidance, interview questions, useful resources and new opportunities.</p></div>
          <a href="https://chat.whatsapp.com/resumeefy-community" target="_blank" rel="noopener noreferrer" className="brand-btn brand-btn-primary">Join the community <span>↗</span></a>
        </div>
      </section>

      <section className="final-cta home-reveal">
        <div className="cta-glow" />
        <span className="section-label light">YOUR NEXT MOVE</span>
        <h2>Your next opportunity deserves a <em>better prepared</em> you.</h2>
        <p>Start free. Find the gaps. Build the confidence. Make the next application count.</p>
        <div className="hero-actions centered"><Link href="/assessment" className="brand-btn brand-btn-gold">Start free assessment <span>↗</span></Link><Link href="/resume-builder" className="brand-btn brand-btn-outline-light">Build your resume <span>→</span></Link></div>
      </section>

      <footer className="site-footer">
        <div className="max-w-6xl mx-auto px-6 footer-inner">
          <div className="footer-brand"><Image src="/brand/resumeefy-wordmark.png" alt="Resumeefy" width={156} height={36} /><p>Better CV. Bigger Opportunities.</p></div>
          <div className="footer-links"><Link href="/assessment">Assessment</Link><Link href="/resume-analyzer">Resume Analyzer</Link><Link href="/resume-builder">Resume Builder</Link><Link href="/login">Log in</Link><Link href="/refer">Affiliate Program</Link></div>
          <div className="footer-copy">© 2026 Resumeefy. Built for ambitious job seekers.</div>
        </div>
      </footer>
    </main>
  );
}
