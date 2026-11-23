"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../landing.css";
import "../partner/partner.css";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("t") || ""); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== again) { setMsg({ ok: false, text: "The two passwords do not match." }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) setDone(true); else setMsg({ ok: false, text: d.error || "Something went wrong." });
    } catch { setMsg({ ok: false, text: "Could not reach the server. Try again." }); }
    setBusy(false);
  }

  return (
    <main id="main-content" className="lp">
      <section className="pt-hero" style={{ minHeight: "70vh" }}>
        <div className="lp-wrap" style={{ maxWidth: 520 }}>
          {done ? (
            <div className="pt-card">
              <h1 style={{ fontSize: "1.8rem" }}>Password changed</h1>
              <p className="pt-note">You can now log in with your new password. Partners can use the partner page.</p>
              <Link href="/login" className="pt-btn" style={{ display: "grid", placeItems: "center" }}>Log in</Link>
              <Link href="/partner" className="pt-note" style={{ color: "var(--lp-link)", fontWeight: 800 }}>Partner log in</Link>
            </div>
          ) : (
            <form className="pt-card" onSubmit={submit}>
              <h1 style={{ fontSize: "1.8rem" }}>Choose a new password</h1>
              {!token && <div className="pt-msg err">This page needs the link from your email.</div>}
              <div className="pt-field"><label htmlFor="rp">New password</label><input id="rp" type="password" className="pt-in" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" /></div>
              <div className="pt-field"><label htmlFor="rp2">Repeat new password</label><input id="rp2" type="password" className="pt-in" value={again} onChange={(e) => setAgain(e.target.value)} minLength={8} required autoComplete="new-password" /></div>
              {msg && <div className={`pt-msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
              <button className="pt-btn" disabled={busy || !token}>{busy ? "Saving..." : "Save new password"}</button>
              <p className="pt-note"><Link href="/forgot-password" style={{ color: "var(--lp-link)", fontWeight: 800 }}>Need a new link?</Link></p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
