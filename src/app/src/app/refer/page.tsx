"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, CurrentUser } from "@/lib/client";

export default function ReferPage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("ref");
    if (code) fetch(`/api/track?action=referral&code=${encodeURIComponent(code)}&path=/refer&source=referral`).catch(() => {});
    api<{ user: CurrentUser }>("/api/auth").then(r => setUser(r.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api<any>("/api/track?action=affiliate_dashboard").then((d)=>{setData(d);setAccountNumber(d?.affiliate?.payout_account_number||"");setAccountName(d?.affiliate?.payout_account_name||"");setBankName(d?.affiliate?.payout_bank_name||"");}).catch(() => {});
  }, [user]);

  const link = useMemo(() => data?.affiliate?.code ? `${location.origin}/?ref=${data.affiliate.code}` : "", [data]);
  const pendingByCurrency = useMemo(() => { const map: Record<string, number> = {}; for (const c of data?.commissions || []) if (c.status === "pending") map[c.currency] = (map[c.currency] || 0) + Number(c.amount || 0); return map; }, [data]);

  async function join() {
    try { await api("/api/track", { method: "POST", body: JSON.stringify({ action: "affiliate_join" }) }); setData(await api<any>("/api/track?action=affiliate_dashboard")); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not create affiliate account"); }
  }

  async function saveAccount() {
    try {
      const r=await api<any>("/api/track",{method:"POST",body:JSON.stringify({action:"affiliate_profile",accountNumber,accountName,bankName})});
      setData((d:any)=>({...d,affiliate:r.affiliate}));
      setError("Payout account details saved.");
    } catch(e) { setError(e instanceof Error?e.message:"Could not save payout account"); }
  }

  async function requestPayout() {
    try {
      await api("/api/track", { method: "POST", body: JSON.stringify({ action: "affiliate_payout", amount: Number(payout), currency: data?.commissions?.[0]?.currency || "USD" }) });
      setPayout(""); setData(await api<any>("/api/track?action=affiliate_dashboard"));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not request payout"); }
  }

  return <main className="min-h-[80vh] bg-[radial-gradient(circle_at_80%_0%,rgba(20,140,192,.18),transparent_30%),linear-gradient(180deg,#07182f,#0b2340)] text-white">
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-3xl"><span className="section-label light">RESUMEEFY PARTNER PROGRAM</span><h1 className="font-display text-5xl md:text-6xl font-semibold mt-4">Turn your career audience into <em>income.</em></h1><p className="text-white/70 text-lg mt-5 max-w-2xl">Share Resumeefy with people who need stronger resumes, better interview practice and practical career preparation. Earn <strong className="text-white">40%</strong> of qualifying credit purchases attributed to your referral.</p></div>
      <div className="grid md:grid-cols-3 gap-4 mt-10"><div className="card !bg-white/10 !border-white/10 p-6"><b className="text-3xl">40%</b><p className="text-white/60 mt-2">commission on credit purchases</p></div><div className="card !bg-white/10 !border-white/10 p-6"><b className="text-3xl">60 days</b><p className="text-white/60 mt-2">referral attribution window</p></div><div className="card !bg-white/10 !border-white/10 p-6"><b className="text-3xl">Your link</b><p className="text-white/60 mt-2">personal code and dashboard</p></div></div>

      {!user && !loading && <div className="mt-10 card !bg-white !text-[var(--ink)] p-8 max-w-xl"><h2 className="font-display text-2xl font-semibold">Become a Resumeefy affiliate</h2><p className="text-[var(--ink-soft)] mt-2">Create a normal Resumeefy account first. Your partner dashboard is then available from this page.</p><div className="flex gap-3 mt-6"><Link href={`/signup?next=${encodeURIComponent("/refer")}&affiliate=1`} className="btn btn-primary">Sign up free</Link><Link href="/login?next=/refer" className="btn btn-ghost">Log in</Link></div></div>}

      {user && !data?.affiliate && !loading && <div className="mt-10 card !bg-white !text-[var(--ink)] p-8 max-w-xl"><h2 className="font-display text-2xl font-semibold">Activate your partner account</h2><p className="text-[var(--ink-soft)] mt-2">Use your existing Resumeefy account. You control what you promote and can monitor clicks, signups, sales and commissions here.</p><button onClick={join} className="btn btn-primary mt-6">Join the partner program</button></div>}

      {data?.affiliate && <div className="mt-10 grid lg:grid-cols-[1.4fr_.6fr] gap-6"><div className="space-y-6"><div className="card !bg-white !text-[var(--ink)] p-7"><div className="flex items-start justify-between gap-4"><div><span className="section-label">YOUR PARTNER DASHBOARD</span><h2 className="font-display text-3xl font-semibold mt-2">{data.affiliate.display_name}</h2><p className="text-sm text-[var(--ink-soft)] mt-1">Code: <strong>{data.affiliate.code}</strong></p></div><span className="px-3 py-1 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] text-xs font-bold">40% commission</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">{[["Clicks",data.affiliate.total_clicks],["Signups",data.affiliate.total_signups],["Sales",data.affiliate.total_sales],["Credits sold",data.affiliate.total_credits]].map(([l,v])=><div key={String(l)} className="rounded-2xl bg-[var(--paper)] p-4"><b className="text-2xl">{v}</b><p className="text-xs text-[var(--ink-soft)] mt-1">{l}</p></div>)}</div><div className="mt-6 p-4 rounded-2xl bg-[var(--blue-dim)]"><p className="text-xs font-bold uppercase tracking-wider text-[var(--blue)]">Your referral link</p><div className="flex gap-2 mt-2"><input className="input !bg-white" readOnly value={link}/><button className="btn btn-primary" onClick={()=>navigator.clipboard?.writeText(link)}>Copy</button></div></div></div><div className="card !bg-white !text-[var(--ink)] p-7"><span className="section-label">PAYOUT DETAILS</span><h3 className="font-display text-xl font-semibold mt-2">Where should we pay you?</h3><p className="text-sm text-[var(--ink-soft)] mt-1">Add the account we should use when your commission is approved for payout.</p><div className="grid md:grid-cols-3 gap-3 mt-5"><input className="input" placeholder="Account number" value={accountNumber} onChange={e=>setAccountNumber(e.target.value)}/><input className="input" placeholder="Account name" value={accountName} onChange={e=>setAccountName(e.target.value)}/><input className="input" placeholder="Bank name" value={bankName} onChange={e=>setBankName(e.target.value)}/></div><button className="btn btn-primary mt-4" onClick={saveAccount}>Save payout details</button></div><div className="card !bg-white !text-[var(--ink)] p-7"><h3 className="font-display text-xl font-semibold">Commission balance</h3><div className="text-4xl font-semibold mt-3">{Object.entries(pendingByCurrency).length ? Object.entries(pendingByCurrency).map(([currency,amount])=><div key={currency}>{currency} {Number(amount).toLocaleString()}</div>) : "0"}</div><p className="text-sm text-[var(--ink-soft)] mt-1">pending commissions, separated by currency</p><div className="flex gap-2 mt-5"><select id="affiliate-currency" className="input max-w-28" defaultValue={Object.keys(pendingByCurrency)[0] || "USD"}>{Object.keys(pendingByCurrency).map(c=><option key={c}>{c}</option>)}</select><input className="input" type="number" placeholder="Amount" value={payout} onChange={e=>setPayout(e.target.value)}/><button className="btn btn-primary" onClick={async()=>{const currency=(document.getElementById("affiliate-currency") as HTMLSelectElement)?.value||"USD";try{await api("/api/track",{method:"POST",body:JSON.stringify({action:"affiliate_payout",amount:Number(payout),currency})});setPayout("");setData(await api<any>("/api/track?action=affiliate_dashboard"));}catch(e){setError(e instanceof Error?e.message:"Could not request payout")}}}>Request</button></div></div></div><div className="card !bg-white !text-[var(--ink)] p-7"><h3 className="font-display text-xl font-semibold">Recent earnings</h3><div className="mt-4 space-y-3">{(data.commissions||[]).slice(0,8).map((c:any)=><div key={c.purchase_id} className="flex justify-between border-b border-[var(--line)] pb-3 text-sm"><span>{new Date(c.created_at).toLocaleDateString()} · {c.status}</span><strong>{c.currency} {Number(c.amount).toLocaleString()}</strong></div>)}{!data.commissions?.length&&<p className="text-sm text-[var(--ink-soft)]">No commissions yet. Share your link when you are ready.</p>}</div></div></div>}
      {error && <p className="mt-6 text-red-300">{error}</p>}
    </section>
  </main>;
}
