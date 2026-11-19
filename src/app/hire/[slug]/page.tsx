"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import "../../landing.css";
import "../../partner/partner.css";

type Job = { title: string; description: string; commissionPct: number; applyDeadline: string | null; phase: "applying" | "applications_closed" | "closed" };

export default function HirePage() {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [missing, setMissing] = useState(false);
  const [f, setF] = useState({ name: "", email: "", whatsapp: "", why: "", accept: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/hire?op=job&slug=${encodeURIComponent(slug)}&f=1`).then(async (r) => {
      if (!r.ok) return setMissing(true);
      setJob((await r.json()).job);
    }).catch(() => setMissing(true));
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await fetch("/api/hire?op=apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, slug }) });
    const d = await r.json().catch(() => ({}));
    setMsg({ ok: r.ok, text: d.message || d.error || "Something went wrong." });
    setBusy(false);
  }
  const set = (k: "name" | "email" | "whatsapp" | "why") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <main id="main-content" className="lp">
      <section className="pt-hero">
        <div className="lp-wrap pt-grid">
          <div>
            {missing ? <h1>This link is not valid.</h1> : !job ? <h1>Loading...</h1> : (
              <>
                <h1>{job.title}</h1>
                <p className="sub">{job.description || "Help job seekers discover Resumeefy and earn commission for every student who buys."}</p>
                <ol className="pt-steps">
                  <li><b>1</b><span>Apply below. It takes two minutes.</span></li>
                  <li><b>2</b><span>We email you a short research task.</span></li>
                  <li><b>3</b><span>Get approved, open your partner account and earn {job.commissionPct}% commission.</span></li>
                </ol>
                {job.applyDeadline && <p className="sub" style={{ marginTop: 18 }}>Applications close {new Date(job.applyDeadline).toLocaleString()}.</p>}
              </>
            )}
          </div>
          {job && (job.phase === "applying" ? (
            <form className="pt-card" onSubmit={submit}>
              <div className="pt-field"><label htmlFor="hn">Full name</label><input id="hn" className="pt-in" value={f.name} onChange={set("name")} required autoComplete="name" /></div>
              <div className="pt-field"><label htmlFor="he">Email</label><input id="he" type="email" className="pt-in" value={f.email} onChange={set("email")} required autoComplete="email" /></div>
              <div className="pt-field"><label htmlFor="hw">WhatsApp number</label><input id="hw" className="pt-in" value={f.whatsapp} onChange={set("whatsapp")} required autoComplete="tel" /></div>
              <div className="pt-field"><label htmlFor="hy">Why should we choose you?</label><textarea id="hy" className="pt-in" style={{ minHeight: 120 }} value={f.why} onChange={set("why")} required minLength={30} /></div>
              <label className="pt-note" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><input type="checkbox" checked={f.accept} onChange={(e) => setF({ ...f, accept: e.target.checked })} style={{ marginTop: 3 }} /> I understand this role pays {job.commissionPct}% commission on sales I bring in, and no salary.</label>
              {msg && <div className={`pt-msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
              <button className="pt-btn" disabled={busy || msg?.ok}>{busy ? "Sending..." : "Apply now"}</button>
            </form>
          ) : <div className="pt-card"><h2 style={{ fontSize: "1.4rem" }}>Applications are closed</h2><p className="pt-note">Thank you for your interest. Watch out for the next opening.</p></div>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
