"use client";

import { useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import "../../landing.css";
import "../../partner/partner.css";

type Info = { name: string; status: string; closed: boolean; job: { title: string; researchDeadline: string | null; commissionPct: number }; research: string };

export default function ResearchPage() {
  const [t, setT] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const tok = new URLSearchParams(window.location.search).get("t") || "";
    setT(tok);
    fetch(`/api/hire?op=research&t=${encodeURIComponent(tok)}`).then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setError(d.error || "This link is not valid.");
      setInfo(d); setText(d.research || "");
    }).catch(() => setError("Could not load this page."));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await fetch("/api/hire?op=research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t, text }) });
    const d = await r.json().catch(() => ({}));
    setMsg({ ok: r.ok, text: d.message || d.error || "Something went wrong." });
    setBusy(false);
  }

  const locked = !!info && (info.closed || !["invited", "submitted"].includes(info.status));
  return (
    <main id="main-content" className="lp">
      <section className="pt-hero">
        <div className="lp-wrap pt-grid">
          <div>
            <h1>{error ? "This link is not valid." : info ? `Hi ${info.name.split(" ")[0]}, your research task` : "Loading..."}</h1>
            {info && <p className="sub">Tell us: (1) three places where job seekers gather, such as WhatsApp groups, campuses or NYSC camps, (2) how you would introduce Resumeefy in each one, and (3) how many people you could realistically reach in your first 30 days. Role: {info.job.title}.{info.job.researchDeadline ? ` Deadline: ${new Date(info.job.researchDeadline).toLocaleString()}.` : ""}</p>}
            {error && <p className="sub">{error}</p>}
          </div>
          {info && (
            <form className="pt-card" onSubmit={submit}>
              <div className="pt-field"><label htmlFor="rt">Your research</label><textarea id="rt" className="pt-in" style={{ minHeight: 260 }} value={text} onChange={(e) => setText(e.target.value)} disabled={locked} required minLength={300} /></div>
              <p className="pt-note">{text.length} characters. Write at least 300.</p>
              {locked && <div className="pt-msg err">{info.closed ? "The deadline has passed." : "You can no longer change this."}</div>}
              {msg && <div className={`pt-msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
              <button className="pt-btn" disabled={busy || locked}>{busy ? "Sending..." : info.status === "submitted" ? "Update my research" : "Send my research"}</button>
            </form>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
