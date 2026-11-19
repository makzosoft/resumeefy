"use client";

import { useCallback, useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import Resources, { type Resource } from "./Resources";
import "../landing.css";
import "./partner.css";

const KEY = "resumeefy_partner_token";
type Money = Record<string, { earned: number; available: number; paid: number }>;
type Dash = {
  pending?: boolean;
  partner: { name: string; email: string; status: string; code: string; rate: number; bank: { bankName: string; accountName: string; accountMasked: string; saved: boolean } };
  kpis?: { clicks: number; signups: number; paying: number; conversion: number };
  money?: Money; minPayout?: Record<string, number>;
  series?: { labels: string[]; clicks: number[]; signups: number[] };
  sources?: { name: string; visits: number }[];
  referrals?: { name: string; email: string; joined: string; status: string; earned: number }[];
  commissions?: { id: string; amount: number; currency: string; status: string; at: string }[];
  payouts?: { id: string; amount: number; currency: string; status: string; created_at: string }[];
  resources?: Resource[];
};

async function call<T>(op: string, token: string | null, body?: unknown, method = body ? "POST" : "GET"): Promise<T> {
  const res = await fetch(`/api/partner?op=${op}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong."), { status: res.status });
  return data as T;
}

const fmt = (n: number, c: string) => `${c} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function Auth({ onToken, hire }: { onToken: (t: string) => void; hire: string }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signup") {
        const r = await call<{ message: string }>("signup", null, { ...f, hire });
        setMsg({ ok: true, text: r.message + (hire ? " You can sign in now." : " You can sign in once you are approved.") });
        setMode("login");
      } else {
        const r = await call<{ token: string }>("login", null, { email: f.email, password: f.password });
        onToken(r.token);
      }
    } catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." }); }
    setBusy(false);
  }

  return (
    <form className="pt-card" onSubmit={submit}>
      <div className="pt-tabs" role="tablist">
        <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>Become a partner</button>
        <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Log in</button>
      </div>
      {mode === "signup" && <div className="pt-field"><label htmlFor="pn">Full name</label><input id="pn" className="pt-in" value={f.name} onChange={set("name")} autoComplete="name" required /></div>}
      <div className="pt-field"><label htmlFor="pe">Email</label><input id="pe" type="email" className="pt-in" value={f.email} onChange={set("email")} autoComplete="email" required /></div>
      {mode === "signup" && <div className="pt-field"><label htmlFor="pp">Phone or WhatsApp number</label><input id="pp" className="pt-in" value={f.phone} onChange={set("phone")} autoComplete="tel" required /></div>}
      <div className="pt-field"><label htmlFor="pw">Password</label><input id="pw" type="password" className="pt-in" value={f.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required /></div>
      {msg && <div className={`pt-msg ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
      <button className="pt-btn" disabled={busy}>{busy ? "Please wait..." : mode === "signup" ? "Create partner account" : "Log in"}</button>
      {mode === "signup" && <p className="pt-note">{hire ? "You were approved through hiring. Use the same email you applied with and your account activates straight away." : "New accounts are reviewed by the Resumeefy team before your link goes live."}</p>}
    </form>
  );
}

function Dashboard({ token, data, reload, logout }: { token: string; data: Dash; reload: () => void; logout: () => void }) {
  const p = data.partner;
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [bank, setBank] = useState({ bankName: "", accountName: "", accountNumber: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/?ref=${p.code}`;
  const track = (kind: string, detail: string) => { call("track", token, { kind, detail }).catch(() => {}); };

  async function act(op: string, body: unknown, after?: () => void) {
    setNote(null);
    try { const r = await call<{ message?: string; amount?: number }>(op, token, body); setNote({ ok: true, text: r.message || (r.amount ? `Payout requested: ${r.amount.toLocaleString()}.` : "Done.") }); after?.(); reload(); }
    catch (err) { setNote({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." }); }
  }

  if (data.pending) {
    return (
      <div className="lp-wrap pt-dash">
        <div className="pt-top"><h1>Hi {p.name.split(" ")[0]}</h1><button className="pt-btn ghost" onClick={logout}>Log out</button></div>
        <div className="pt-panel"><h2>Your account is waiting for approval</h2><p className="pt-empty">We review every new partner. Once approved, your personal link and dashboard open up here. Check back soon.</p></div>
      </div>
    );
  }

  const k = data.kpis!, s = data.series!;
  const max = Math.max(1, ...s.clicks, ...s.signups);
  const currencies = Object.keys(data.money || {});
  return (
    <div className="lp-wrap pt-dash">
      <div className="pt-top">
        <h1>Hi {p.name.split(" ")[0]}<span className="pt-badge">{Math.round(p.rate * 100)}% commission</span></h1>
        <button className="pt-btn ghost" onClick={logout}>Log out</button>
      </div>

      <div className="pt-link">
        <b>Your referral link</b>
        <code>{link}</code>
        <button className="pt-btn gold" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); track("copy_link", "referral link"); }}>{copied ? "Copied" : "Copy link"}</button>
      </div>

      <div className="pt-kpis">
        <div className="pt-kpi"><b>{k.clicks}</b><span>Link clicks</span></div>
        <div className="pt-kpi"><b>{k.signups}</b><span>Signups</span></div>
        <div className="pt-kpi"><b>{k.paying}</b><span>Paying students</span></div>
        <div className="pt-kpi"><b>{k.conversion}%</b><span>Signup to paid</span></div>
      </div>

      {note && <div className={`pt-msg ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}

      <div className="pt-two">
        <section className="pt-panel">
          <h2>Earnings</h2>
          {currencies.length === 0 ? <p className="pt-empty">No commissions yet. Share your link to get started.</p> : (
            <div className="pt-money">
              {currencies.map((c) => { const m = data.money![c]; const min = data.minPayout?.[c] ?? 10; return (
                <div key={c}>
                  <div className="pt-cur"><div><b>{fmt(m.earned, c)}</b><span>Earned</span></div><div><b>{fmt(m.available, c)}</b><span>Available</span></div><div><b>{fmt(m.paid, c)}</b><span>Paid</span></div></div>
                  <button className="pt-btn" style={{ marginTop: 10, width: "100%" }} disabled={m.available < min} onClick={() => act("payout", { currency: c })}>{m.available < min ? `Minimum payout ${fmt(min, c)}` : `Request ${fmt(m.available, c)} payout`}</button>
                </div>); })}
            </div>
          )}
        </section>
        <section className="pt-panel">
          <h2>Last 30 days</h2>
          <div className="pt-chart" aria-label="Clicks and signups per day">
            {s.labels.map((l, i) => <span key={l} style={{ display: "contents" }}><i title={`${l}: ${s.clicks[i]} clicks`} style={{ height: `${(s.clicks[i] / max) * 100}%` }} /><i className="s" title={`${l}: ${s.signups[i]} signups`} style={{ height: `${(s.signups[i] / max) * 100}%` }} /></span>)}
          </div>
          <div className="pt-legend"><span>Clicks</span><span className="s">Signups</span></div>
          {data.sources && data.sources.length > 0 && <div className="pt-scroll"><table className="pt-table"><thead><tr><th>Traffic source</th><th>Visits</th></tr></thead><tbody>{data.sources.map((x) => <tr key={x.name}><td>{x.name}</td><td>{x.visits}</td></tr>)}</tbody></table></div>}
        </section>
      </div>

      <div className="pt-two">
        <section className="pt-panel">
          <h2>Referrals</h2>
          {data.referrals?.length ? <div className="pt-scroll"><table className="pt-table"><thead><tr><th>Student</th><th>Joined</th><th>Status</th></tr></thead><tbody>{data.referrals.map((r, i) => <tr key={i}><td>{r.name}<br /><span className="pt-note">{r.email}</span></td><td>{new Date(r.joined).toLocaleDateString()}</td><td>{r.status}</td></tr>)}</tbody></table></div> : <p className="pt-empty">No signups from your link yet.</p>}
        </section>
        <section className="pt-panel">
          <h2>Commissions and payouts</h2>
          {data.commissions?.length ? <div className="pt-scroll"><table className="pt-table"><thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{data.commissions.slice(0, 12).map((c) => <tr key={c.id}><td>{new Date(c.at).toLocaleDateString()}</td><td>{fmt(c.amount, c.currency)}</td><td>{c.status}</td></tr>)}</tbody></table></div> : <p className="pt-empty">Commissions appear here when a student you referred buys credits.</p>}
          {data.payouts?.length ? <div className="pt-scroll"><table className="pt-table"><thead><tr><th>Payout</th><th>Amount</th><th>Status</th></tr></thead><tbody>{data.payouts.map((x) => <tr key={x.id}><td>{new Date(x.created_at).toLocaleDateString()}</td><td>{fmt(x.amount, x.currency)}</td><td>{x.status}</td></tr>)}</tbody></table></div> : null}
        </section>
      </div>

      {data.resources && <Resources items={data.resources} link={link} track={track} />}

      <div className="pt-two">
        <form className="pt-panel" onSubmit={(e) => { e.preventDefault(); act("bank", bank, () => setBank({ bankName: "", accountName: "", accountNumber: "" })); }}>
          <h2>Bank details</h2>
          <p className="pt-note">{p.bank.saved ? `Saved: ${p.bank.bankName}, ${p.bank.accountName}, ${p.bank.accountMasked}. Enter new details below to replace them.` : "Add the account where you want to be paid. It is stored encrypted."}</p>
          <div className="pt-field"><label htmlFor="bb">Bank name</label><input id="bb" className="pt-in" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} required /></div>
          <div className="pt-field"><label htmlFor="ba">Account name</label><input id="ba" className="pt-in" value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} required /></div>
          <div className="pt-field"><label htmlFor="bn">Account number</label><input id="bn" inputMode="numeric" className="pt-in" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} maxLength={10} required /></div>
          <button className="pt-btn">Save bank details</button>
        </form>
        <form className="pt-panel" onSubmit={(e) => { e.preventDefault(); act("password", pw, () => setPw({ current: "", next: "" })); }}>
          <h2>Change password</h2>
          <div className="pt-field"><label htmlFor="pc">Current password</label><input id="pc" type="password" className="pt-in" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
          <div className="pt-field"><label htmlFor="px">New password</label><input id="px" type="password" className="pt-in" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
          <button className="pt-btn">Update password</button>
        </form>
      </div>
    </div>
  );
}

export default function PartnerPage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Dash | null>(null);
  const [ready, setReady] = useState(false);
  const [hire, setHire] = useState("");

  const logout = useCallback(() => { localStorage.removeItem(KEY); setToken(null); setData(null); }, []);
  const load = useCallback(async (t: string) => {
    try { setData(await call<Dash>("me", t)); }
    catch (e) { if ((e as { status?: number }).status === 401) logout(); }
  }, [logout]);

  useEffect(() => {
    setHire(new URLSearchParams(window.location.search).get("hire") || "");
    const t = localStorage.getItem(KEY);
    if (t) { setToken(t); load(t); }
    setReady(true);
  }, [load]);

  const signedIn = (t: string) => { localStorage.setItem(KEY, t); setToken(t); load(t); };

  return (
    <main id="main-content" className="lp">
      {token && data ? (
        <Dashboard token={token} data={data} reload={() => load(token)} logout={logout} />
      ) : (
        <section className="pt-hero">
          <div className="lp-wrap pt-grid">
            <div>
              <h1>Earn 40% every time someone you refer buys.</h1>
              <p className="sub">Share your personal link with people who want stronger resumes and sharper interviews. Track every click and signup, then request your payout.</p>
              <ol className="pt-steps">
                <li><b>1</b><span>Create a free partner account and wait for a quick approval.</span></li>
                <li><b>2</b><span>Share your link. Signups are tracked for 60 days.</span></li>
                <li><b>3</b><span>Earn commission on credit purchases and cash out to your bank.</span></li>
              </ol>
            </div>
            {ready && !(token && !data) ? <Auth onToken={signedIn} hire={hire} /> : <div className="pt-card"><p className="pt-note">Loading your dashboard...</p></div>}
          </div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}
