"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Bars, Columns, Funnel, Kpi, Trend, fmtN, money, ago } from "./charts";

type D = {
  range: { label: string; bucket: string; from: string | null; to: string };
  totals: { users: number };
  kpis: { signups: { v: number; p: number }; active: { v: number; p: number }; assessments: { v: number; p: number }; buyers: { v: number; p: number }; leads: { v: number }; avgScore: number; revenue: Record<string, number>; revenuePrev: Record<string, number> };
  series: { labels: string[]; signups: number[]; active: number[]; assessments: number[]; purchases: number[] };
  hours: number[]; weekdays: number[]; funnel: { name: string; count: number }[]; topEvents: { name: string; count: number }[]; topTools: { name: string; count: number }[];
  recent: { amount: number; currency: string; credits: number; at: string }[]; insights: { tone: string; text: string }[];
};
const RANGES: [string, string][] = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"], ["all", "All time"]];
type MKey = "signups" | "active" | "assessments" | "purchases";
const METRICS: [MKey, string][] = [["signups", "Signups"], ["active", "Active events"], ["assessments", "Assessments"], ["purchases", "Purchases"]];
const HOURS = Array.from({ length: 24 }, (_, h) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Overview() {
  const [range, setRange] = useState("7d");
  const [metric, setMetric] = useState<MKey>("signups");
  const [d, setD] = useState<D | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setBusy(true);
    api<D>(`/api/admin/dashboard?range=${range}`).then((x) => { if (live) { setD(x); setError(""); } }).catch((e) => live && setError(e.message)).finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [range]);

  const pill = (on: boolean) => `px-3 py-2 rounded-full text-xs font-bold border ${on ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "border-[var(--line)]"}`;
  if (error) return <div className="card p-6 text-[var(--coral)]">{error}</div>;
  if (!d) return <div className="card p-6">Loading the numbers…</div>;
  const total = d.series[metric].reduce((a, b) => a + b, 0);

  return (
    <div className={busy ? "opacity-60" : ""}>
      <div className="flex flex-wrap gap-2">{RANGES.map(([k, l]) => <button key={k} className={pill(range === k)} onClick={() => setRange(k)}>{l}</button>)}</div>
      <p className="text-xs text-[var(--ink-soft)] mt-2">{d.range.label} · {d.range.from || "start"} to {d.range.to} · compared with the period before it</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
        <Kpi label="New signups" value={fmtN(d.kpis.signups.v)} v={d.kpis.signups.v} p={range === "all" ? undefined : d.kpis.signups.p} sub={`${fmtN(d.totals.users)} users overall`} />
        <Kpi label="Active users" value={fmtN(d.kpis.active.v)} v={d.kpis.active.v} p={range === "all" ? undefined : d.kpis.active.p} />
        <Kpi label="Assessments" value={fmtN(d.kpis.assessments.v)} v={d.kpis.assessments.v} p={range === "all" ? undefined : d.kpis.assessments.p} sub={d.kpis.avgScore ? `Average score ${d.kpis.avgScore}` : undefined} />
        <Kpi label="Credit revenue" value={money(d.kpis.revenue)} sub={range === "all" ? undefined : `Before: ${money(d.kpis.revenuePrev)}`} />
        <Kpi label="Paying users" value={fmtN(d.kpis.buyers.v)} v={d.kpis.buyers.v} p={range === "all" ? undefined : d.kpis.buyers.p} />
        <Kpi label="Leads captured" value={fmtN(d.kpis.leads.v)} />
      </div>

      <div className="card p-6 mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-sm">Trend</h2>
          <div className="flex flex-wrap gap-2">{METRICS.map(([k, l]) => <button key={k} className={pill(metric === k)} onClick={() => setMetric(k)}>{l}</button>)}</div></div>
        <div className="mt-4"><Trend labels={d.series.labels} values={d.series[metric]} /></div>
        <p className="text-xs text-[var(--ink-soft)] mt-2">{fmtN(total)} in this period, by {d.range.bucket}.</p>
      </div>

      <div className="card p-6 mt-5">
        <h2 className="font-bold text-sm mb-3">What the numbers suggest</h2>
        <ul className="space-y-2">{d.insights.map((i, k) => <li key={k} className="text-sm flex gap-2"><span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${i.tone === "good" ? "bg-[#12a77b]" : i.tone === "warn" ? "bg-[var(--coral)]" : "bg-[var(--blue)]"}`} />{i.text}</li>)}</ul>
        <p className="text-xs text-[var(--ink-soft)] mt-3">Automatic observations, not proof of cause. Use them as prompts for what to look at.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-5">
        <div className="card p-6"><h2 className="font-bold text-sm mb-3">When users are active (hour, Lagos time)</h2><Columns values={d.hours} labels={HOURS} /></div>
        <div className="card p-6"><h2 className="font-bold text-sm mb-3">Busiest days</h2><Columns values={d.weekdays} labels={DAYS} /></div>
        <div className="card p-6"><h2 className="font-bold text-sm mb-3">Funnel</h2><Funnel steps={d.funnel} /></div>
        <div className="card p-6"><h2 className="font-bold text-sm mb-3">Most used paid features</h2><Bars data={d.topTools} empty="No credits spent in this period." /></div>
        <div className="card p-6"><h2 className="font-bold text-sm mb-3">All activity</h2><Bars data={d.topEvents} /></div>
        <div className="card p-6"><h2 className="font-bold text-sm mb-3">Recent credit purchases</h2>
          {d.recent.length ? <div className="space-y-2">{d.recent.map((r, i) => <div key={i} className="flex justify-between text-sm border-b border-[var(--line)] pb-2"><span>{r.currency} {r.amount.toLocaleString()}</span><span className="text-[var(--ink-soft)]">{r.credits} credits · {ago(r.at)}</span></div>)}</div> : <p className="text-sm text-[var(--ink-soft)]">No purchases yet.</p>}</div>
      </div>
    </div>
  );
}
