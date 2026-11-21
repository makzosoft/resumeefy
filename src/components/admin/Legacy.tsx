"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

type Stats = {
  totalUsers: number; totalLeads: number; totalAssessments: number; avgScore: number; successfulPayments: number; revenueByCurrency: Record<string, number>;
  eventCounts: { name: string; count: number }[]; recentEvents: { name: string; created_at: string; email: string | null }[];
  affiliates: any[]; affiliateCommissions: any[]; affiliatePayouts: any[]; blogProgress: any[]; referralLeads: any[]; userReferrals: any[]; dailyLoginRewards: any[];
};

export default function Legacy({ part }: { part: "partners" | "blog" | "growth" }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api<Stats>("/api/admin").then(setStats).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  if (error) return <div className="card p-6 text-[var(--coral)]">{error}</div>;
  if (!stats) return <div className="card p-6">Loading…</div>;

  if (part === "partners") return (
    <div>
      <div className="card p-5 flex flex-wrap items-center justify-between gap-3"><div><b>Approvals, activity and hiring</b><div className="text-xs text-[var(--ink-soft)] mt-1">Approve new partners, see what they do and run hiring rounds.</div></div><Link href="/admin/partners" className="btn btn-primary !px-4 !py-2 text-xs">Open partners and hiring</Link></div>
      <div className="grid lg:grid-cols-2 gap-6 mt-5">
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-3">Affiliate performance</h2>
          <div className="space-y-3">{stats.affiliates.slice(0, 10).map((a: any) => <div key={a.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3"><div><b>{a.display_name}</b><div className="text-xs text-[var(--ink-soft)]">{a.code} · {a.status}</div></div><div className="text-right text-xs"><b>{a.total_sales}</b> sales<br /><span>{a.total_clicks} clicks · {a.total_signups} signups</span><br /><span className="text-[var(--ink-soft)]">{a.payout_account_number ? `Acct ••••${String(a.payout_account_number).slice(-4)}` : "No payout account"}</span><br /><button className="text-[var(--blue)] font-bold mt-1" onClick={async () => { await api("/api/admin", { method: "POST", body: JSON.stringify({ action: "affiliate_status", affiliateId: a.id, status: a.status === "active" ? "suspended" : "active" }) }); load(); }}>{a.status === "active" ? "Suspend" : "Activate"}</button></div></div>)}{!stats.affiliates.length && <p className="text-sm text-[var(--ink-soft)]">No partners yet.</p>}</div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-3">Payout requests</h2>
          <div className="space-y-3">{stats.affiliatePayouts.slice(0, 10).map((p: any) => <div key={p.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3 text-sm"><div><b>{p.affiliates?.display_name || p.affiliates?.code || "Partner"}</b><div className="text-xs text-[var(--ink-soft)]">{p.currency} {Number(p.amount).toLocaleString()} · {p.status}</div></div><div className="whitespace-nowrap"><button className="text-[var(--blue)] font-bold text-xs mr-3" onClick={async () => { const r: any = await api("/api/admin", { method: "POST", body: JSON.stringify({ action: "partner_bank", code: p.affiliates?.code }) }); alert(r.accountNumber ? `${r.bankName}\n${r.accountName}\n${r.accountNumber}` : "No bank details saved yet."); }}>Bank details</button>{p.status !== "paid" && <button className="btn btn-primary !px-3 !py-2 text-xs" onClick={async () => { await api("/api/admin", { method: "POST", body: JSON.stringify({ action: "affiliate_payout_paid", payoutId: p.id }) }); load(); }}>Mark paid</button>}</div></div>)}{!stats.affiliatePayouts.length && <p className="text-sm text-[var(--ink-soft)]">No payout requests.</p>}</div>
        </div>
      </div>
    </div>
  );

  if (part === "blog") return (
    <div className="card p-6">
      <h2 className="font-bold text-sm">Blog progress</h2><p className="text-xs text-[var(--ink-soft)] mt-1">On site engagement by article.</p>
      <div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-[var(--ink-soft)]"><th className="py-2 pr-4">Article</th><th className="py-2">Keyword</th><th className="py-2">Words</th><th className="py-2">Reads</th><th className="py-2">Shares</th><th className="py-2">CTAs</th></tr></thead>
        <tbody>{stats.blogProgress.slice(0, 30).map((p: any) => <tr key={p.id} className="border-t border-[var(--line)]"><td className="py-3 pr-4"><div className="font-semibold">{p.title}</div><div className="text-xs text-[var(--ink-soft)]">{p.topic || "Career"}</div></td><td className="py-3">{p.primary_keyword || "—"}</td><td className="py-3">{p.word_count}</td><td className="py-3">{p.views}</td><td className="py-3">{p.shares}</td><td className="py-3">{p.ctas}</td></tr>)}{!stats.blogProgress.length && <tr><td colSpan={6} className="py-4 text-[var(--ink-soft)]">No articles yet.</td></tr>}</tbody></table></div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-6"><h2 className="font-bold text-sm mb-3">Referred email signups ({stats.referralLeads.length})</h2>
        <div className="space-y-2">{stats.referralLeads.slice(0, 15).map((l: any) => <div key={`${l.email}-${l.affiliate_code}`} className="flex justify-between text-sm border-b border-[var(--line)] py-2"><span>{l.email}</span><span className="text-[var(--ink-soft)]">{l.affiliate_code} · {l.converted_at ? "joined" : "not yet"}</span></div>)}{!stats.referralLeads.length && <p className="text-sm text-[var(--ink-soft)]">None yet.</p>}</div></div>
      <div className="card p-6"><h2 className="font-bold text-sm mb-3">User invite rewards ({stats.userReferrals.length})</h2>
        <div className="space-y-2">{stats.userReferrals.slice(0, 15).map((r: any) => <div key={r.id} className="flex justify-between text-sm border-b border-[var(--line)] py-2"><span>{r.invitee_email}</span><span className="font-bold">{r.status} · +{r.inviter_reward}</span></div>)}{!stats.userReferrals.length && <p className="text-sm text-[var(--ink-soft)]">None yet.</p>}</div>
        <p className="text-xs text-[var(--ink-soft)] mt-4">Daily login rewards claimed: <b>{stats.dailyLoginRewards.length}</b></p></div>
      <div className="card p-6"><h2 className="font-bold text-sm mb-3">Events by type</h2>
        <div className="space-y-2">{stats.eventCounts.map((e) => <div key={e.name} className="flex justify-between text-sm border-b border-[var(--line)] py-2"><span>{e.name}</span><b>{e.count}</b></div>)}</div></div>
      <div className="card p-6"><h2 className="font-bold text-sm mb-3">Recent activity</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">{stats.recentEvents.map((e, i) => <div key={i} className="text-xs text-[var(--ink-soft)] border-b border-[var(--line)] py-2">{new Date(e.created_at).toLocaleString()} · {e.name} {e.email ? `· ${e.email}` : ""}</div>)}</div></div>
    </div>
  );
}
