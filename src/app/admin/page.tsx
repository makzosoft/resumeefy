"use client";
import { useEffect, useState } from "react";
import { api, CurrentUser } from "@/lib/client";

type Stats = {
  totalUsers: number;
  totalLeads: number;
  totalAssessments: number;
  avgScore: number;
  totalRevenue: number;
  successfulPayments: number;
  eventCounts: { name: string; count: number }[];
  recentEvents: { name: string; created_at: string; email: string | null; meta: Record<string, unknown> }[];
  dailySignups: { day: string; count: number }[];
  affiliates: any[];
  affiliateCommissions: any[];
  affiliatePayouts: any[];
  blogProgress: any[];
  referralLeads: any[];
  revenueByCurrency: Record<string, number>;
  userReferrals: any[];
  dailyLoginRewards: any[];
};

export default function AdminPage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ user: CurrentUser }>("/api/auth").then((r) => setUser(r.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    api<Stats>("/api/admin")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [user]);

  if (user && user.role !== "admin") {
    return <div className="max-w-2xl mx-auto px-6 py-20 text-center">This page is for admins only.</div>;
  }
  if (error) return <div className="max-w-2xl mx-auto px-6 py-20 text-center text-[var(--coral)]">{error}</div>;
  if (!stats) return <div className="max-w-2xl mx-auto px-6 py-20 text-center">Loading real, cross-user data…</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl font-semibold">Admin Dashboard</h1>
      <p className="text-[var(--ink-soft)] mt-2">Real data, aggregated across every user in the database.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          ["Total users", stats.totalUsers],
          ["Leads captured", stats.totalLeads],
          ["Assessments taken", stats.totalAssessments],
          ["Avg. score", stats.avgScore],
          ["Successful credit purchases", stats.successfulPayments],
          ["Credit revenue", Object.entries(stats.revenueByCurrency).map(([c,v])=>`${c} ${Number(v).toLocaleString()}`).join(" · ") || "0"],
          ["Active affiliates", stats.affiliates.filter((a:any)=>a.status === "active").length],
          ["Affiliate commissions", stats.affiliateCommissions.length],
          ["Friend referrals completed", stats.userReferrals.filter((r:any)=>r.status === "completed").length],
          ["Daily rewards issued", stats.dailyLoginRewards.length],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-5">
            <div className="text-xs font-bold text-[var(--ink-soft)]">{label}</div>
            <div className="font-display text-2xl font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>


      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-3">Affiliate performance</h2>
          <div className="space-y-3">{stats.affiliates.slice(0,10).map((a:any)=><div key={a.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3"><div><b>{a.display_name}</b><div className="text-xs text-[var(--ink-soft)]">{a.code} · {a.status}</div></div><div className="text-right text-xs"><b>{a.total_sales}</b> sales<br/><span>{a.total_clicks} clicks · {a.total_signups} signups</span><br/><span className="text-[var(--ink-soft)]">{a.payout_account_number ? `Acct ••••${String(a.payout_account_number).slice(-4)}` : "No payout account"}</span><br/><button className="text-[var(--blue)] font-bold mt-1" onClick={async()=>{await api("/api/admin",{method:"POST",body:JSON.stringify({action:"affiliate_status",affiliateId:a.id,status:a.status === "active" ? "suspended" : "active"})});setStats(await api<Stats>("/api/admin"));}}>{a.status === "active" ? "Suspend" : "Activate"}</button></div></div>)}</div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-3">Payout requests</h2>
          <div className="space-y-3">{stats.affiliatePayouts.slice(0,10).map((p:any)=><div key={p.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3 text-sm"><div><b>{p.affiliates?.display_name || p.affiliates?.code || "Affiliate"}</b><div className="text-xs text-[var(--ink-soft)]">{p.currency} {Number(p.amount).toLocaleString()} · {p.status}</div></div>{p.status !== "paid" && <button className="btn btn-primary !px-3 !py-2 text-xs" onClick={async()=>{await api("/api/admin",{method:"POST",body:JSON.stringify({action:"affiliate_payout_paid",payoutId:p.id})});const next=await api<Stats>("/api/admin");setStats(next);}}>Mark paid</button>}</div>)}</div>
        </div>
      </div>

      <div className="card p-6 mt-8">
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-bold text-sm">Referred email signups</h2><p className="text-xs text-[var(--ink-soft)] mt-1">Email referrals captured from affiliate links, with conversion and attribution expiry.</p></div><b>{stats.referralLeads.length}</b></div>
        <div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-[var(--ink-soft)]"><th className="py-2 pr-4">Email</th><th className="py-2">Affiliate</th><th className="py-2">Converted</th><th className="py-2">Expires</th></tr></thead><tbody>{stats.referralLeads.slice(0,25).map((l:any)=><tr key={`${l.email}-${l.affiliate_code}`} className="border-t border-[var(--line)]"><td className="py-3 pr-4">{l.email}</td><td className="py-3">{l.affiliate_code}</td><td className="py-3">{l.converted_at ? "Yes" : "No"}</td><td className="py-3">{new Date(l.expires_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      </div>

      <div className="card p-6 mt-8">
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-bold text-sm">Blog progress</h2><p className="text-xs text-[var(--ink-soft)] mt-1">On site engagement by article. Search Console data can be added later for impressions, clicks and position.</p></div></div>
        <div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-[var(--ink-soft)]"><th className="py-2 pr-4">Article</th><th className="py-2">Keyword</th><th className="py-2">Intent</th><th className="py-2">Promotion</th><th className="py-2">Words</th><th className="py-2">Reads</th><th className="py-2">Shares</th><th className="py-2">CTAs</th></tr></thead><tbody>{stats.blogProgress.slice(0,20).map((p:any)=><tr key={p.id} className="border-t border-[var(--line)]"><td className="py-3 pr-4"><div className="font-semibold">{p.title}</div><div className="text-xs text-[var(--ink-soft)]">{p.topic || "Career"}</div></td><td className="py-3">{p.primary_keyword || "—"}</td><td className="py-3">{p.search_intent || "—"}</td><td className="py-3">{p.marketing?.recommendedService || "none"}</td><td className="py-3">{p.word_count}</td><td className="py-3">{p.views}</td><td className="py-3">{p.shares}</td><td className="py-3">{p.ctas}</td></tr>)}</tbody></table></div>
      </div>


      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-2">User invite rewards</h2>
          <p className="text-xs text-[var(--ink-soft)]">Small growth incentives are tracked separately from the paid affiliate programme.</p>
          <div className="mt-4 space-y-2">{stats.userReferrals.slice(0,10).map((r:any)=><div key={r.id} className="flex justify-between text-sm border-b border-[var(--line)] py-2"><span>{r.invitee_email}</span><span className="font-bold">{r.status} · +{r.inviter_reward}</span></div>)}</div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-2">Daily login rewards</h2>
          <p className="text-xs text-[var(--ink-soft)]">One tiny credit per account per calendar day. These rewards are not intended to replace credit purchases.</p>
          <div className="mt-4 text-3xl font-display font-semibold">{stats.dailyLoginRewards.length}</div>
          <p className="text-xs text-[var(--ink-soft)] mt-1">reward claims recorded</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-3">Events by type</h2>
          <div className="space-y-2">
            {stats.eventCounts.map((e) => (
              <div key={e.name} className="flex justify-between text-sm border-b border-[var(--line)] py-2">
                <span>{e.name}</span>
                <span className="font-bold">{e.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-sm mb-3">Recent activity</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats.recentEvents.map((e, i) => (
              <div key={i} className="text-xs text-[var(--ink-soft)] border-b border-[var(--line)] py-2">
                {new Date(e.created_at).toLocaleString()} · {e.name} {e.email ? `· ${e.email}` : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
