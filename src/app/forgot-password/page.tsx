"use client";

import { useState } from "react";
import Link from "next/link";
import "../landing.css";
import "../partner/partner.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"user" | "partner">("user");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, type }) });
      const d = await r.json().catch(() => ({}));
      setMsg({ ok: r.ok, text: d.message || d.error || "Something went wrong." });
    } catch { setMsg({ ok: false, text: "Could not reach the server. Try again." }); }
    setBusy(false);
  }

  return (
    <main id="main-content" className="lp">
      <section className="pt-hero" style={{ minHeight: "70vh" }}>
        <div className="lp-wrap" style={{ maxWidth: 520 }}>
          <form className="pt-card" onSubmit={submit}>
            <h1 style={{ fontSize: "1.8rem" }}>Forgot your password?</h1>
            <p className="pt-note">Enter your email and we will send you a link to choose a new one.</p>
            <div className="pt-tabs" role="tablist">
              <button type="button" className={type === "user" ? "on" : ""} onClick={() => setType("user")}>My account</button>
              <button type="button" className={type === "partner" ? "on" : ""} onClick={() => setType("partner")}>Partner account</button>
            </div>
            <div className="pt-field"><label htmlFor="fe">Email</label><input id="fe" type="email" className="pt-in" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
            {msg && <div className={`pt-msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
            <button className="pt-btn" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
            <p className="pt-note"><Link href="/login" style={{ color: "var(--lp-link)", fontWeight: 800 }}>Back to log in</Link></p>
          </form>
        </div>
      </section>
    </main>
  );
}
