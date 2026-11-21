export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

const DAY = 86400000;
const RANGES: Record<string, { label: string; days: number }> = { today: { label: "Today", days: 1 }, "7d": { label: "7 days", days: 7 }, "30d": { label: "30 days", days: 30 }, "90d": { label: "90 days", days: 90 }, all: { label: "All time", days: 0 } };
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
const startOfDay = (t: number) => { const d = new Date(t); d.setUTCHours(0, 0, 0, 0); return d.getTime(); };

export async function GET(req: NextRequest) {
  const s = await getCurrentSession();
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  // Light mode: only the counters for the tab badges and the bell.
  if (req.nextUrl.searchParams.get("light")) {
    const [m, a, po, ap] = await Promise.all([
      db.from("contact_messages").select("status").eq("status", "new").limit(5000),
      db.from("affiliates").select("status").eq("status", "pending").not("email", "is", null).limit(5000),
      db.from("affiliate_payout_requests").select("status").eq("status", "requested").limit(2000),
      db.from("hiring_applications").select("status").in("status", ["applied", "submitted"]).limit(5000),
    ]);
    const n = (x: { data: unknown }) => (Array.isArray(x.data) ? x.data.length : 0);
    return NextResponse.json({ alerts: { messages: n(m), partners: n(a), payouts: n(po), hiring: n(ap) } }, { headers: { "Cache-Control": "no-store" } });
  }

  const key = req.nextUrl.searchParams.get("range") || "7d";
  const r = RANGES[key] || RANGES["7d"];
  const now = Date.now();
  const to = now;
  const from = r.days === 0 ? 0 : r.days === 1 ? startOfDay(now) : startOfDay(now) - (r.days - 1) * DAY;
  const span = r.days === 0 ? 0 : r.days === 1 ? DAY : r.days * DAY;
  const prevFrom = span ? from - span : 0;
  const fetchFrom = new Date(prevFrom || 0).toISOString();

  const [users, events, assess, purch, tx, msgs, aff, payouts, apps, leads] = await Promise.all([
    db.from("users").select("id,created_at").limit(50000),
    db.from("tracking_events").select("name,created_at,user_id").gte("created_at", fetchFrom).limit(30000),
    db.from("assessments").select("user_id,completed_at,overall_score").gte("completed_at", fetchFrom).limit(20000),
    db.from("credit_purchases").select("user_id,amount,currency,credits,status,created_at,completed_at").gte("created_at", fetchFrom).limit(20000),
    db.from("credit_transactions").select("type,feature,created_at").gte("created_at", fetchFrom).limit(30000),
    db.from("contact_messages").select("status").limit(5000),
    db.from("affiliates").select("status").not("email", "is", null).limit(5000),
    db.from("affiliate_payout_requests").select("status").limit(2000),
    db.from("hiring_applications").select("status").limit(5000),
    db.from("leads").select("created_at").gte("created_at", fetchFrom).limit(20000),
  ]);

  const inR = (t: string) => { const x = new Date(t).getTime(); return x >= from && x <= to; };
  const inP = (t: string) => { const x = new Date(t).getTime(); return span > 0 && x >= prevFrom && x < from; };
  const U = (users.data as any[]) || [], E = (events.data as any[]) || [], A = (assess.data as any[]) || [], P = ((purch.data as any[]) || []).filter((p) => p.status === "successful"), T = (tx.data as any[]) || [], L = (leads.data as any[]) || [];

  const bucket = r.days === 1 ? "hour" : r.days === 0 ? "month" : "day";
  const keyOf = (t: string) => { const d = new Date(t); const iso = d.toISOString(); return bucket === "hour" ? iso.slice(0, 13) : bucket === "month" ? iso.slice(0, 7) : iso.slice(0, 10); };
  const keys: string[] = [];
  if (bucket === "hour") { const d0 = startOfDay(now); for (let h = 0; h < 24; h++) keys.push(new Date(d0 + h * 3600000).toISOString().slice(0, 13)); }
  else if (bucket === "day") { for (let i = r.days - 1; i >= 0; i--) keys.push(new Date(startOfDay(now) - i * DAY).toISOString().slice(0, 10)); }
  else { const first = U.length ? Math.min(...U.map((u) => new Date(u.created_at).getTime())) : now; const d = new Date(first); d.setUTCDate(1); for (; d.getTime() <= now; d.setUTCMonth(d.getUTCMonth() + 1)) keys.push(d.toISOString().slice(0, 7)); }
  const series = (rows: any[], tf: string, val: (x: any) => number = () => 1) => { const m: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0])); rows.filter((x) => inR(x[tf])).forEach((x) => { const k = keyOf(x[tf]); if (k in m) m[k] += val(x); }); return keys.map((k) => m[k]); };

  const money = (rows: any[]) => { const m: Record<string, number> = {}; rows.forEach((p) => { m[p.currency] = (m[p.currency] || 0) + Number(p.amount); }); return m; };
  const pr = P.filter((p) => inR(p.completed_at || p.created_at)), pp = P.filter((p) => inP(p.completed_at || p.created_at));
  const uniq = (rows: any[], f: string) => new Set(rows.map((x) => x[f]).filter(Boolean)).size;

  const signups = U.filter((u) => inR(u.created_at)).length, signupsPrev = U.filter((u) => inP(u.created_at)).length;
  const activeIds = E.filter((e) => inR(e.created_at)).map((e) => e.user_id);
  const active = new Set(activeIds.filter(Boolean)).size;
  const activePrev = new Set(E.filter((e) => inP(e.created_at)).map((e) => e.user_id).filter(Boolean)).size;
  const assessN = A.filter((a) => inR(a.completed_at)).length, assessPrev = A.filter((a) => inP(a.completed_at)).length;
  const avgScore = (() => { const x = A.filter((a) => inR(a.completed_at)); return x.length ? Math.round(x.reduce((s2, a) => s2 + Number(a.overall_score || 0), 0) / x.length) : 0; })();
  const leadsN = L.filter((l) => inR(l.created_at)).length;

  const hours = new Array(24).fill(0), weekdays = new Array(7).fill(0);
  const names: Record<string, number> = {};
  E.filter((e) => inR(e.created_at)).forEach((e) => { const d = new Date(e.created_at); hours[(d.getUTCHours() + 1) % 24]++; weekdays[(d.getUTCDay() + 6) % 7]++; names[e.name] = (names[e.name] || 0) + 1; }); // hours shown in Lagos time (UTC+1)
  const tools: Record<string, number> = {};
  T.filter((t) => t.type === "spend" && inR(t.created_at)).forEach((t) => { const f = String(t.feature || "other"); tools[f] = (tools[f] || 0) + 1; });
  const top = (m: Record<string, number>, n = 8) => Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, n);

  const buyers = uniq(pr, "user_id"), tookAssess = uniq(A.filter((a) => inR(a.completed_at)), "user_id");
  const funnel = [{ name: "Signups", count: signups }, { name: "Took an assessment", count: tookAssess }, { name: "Bought credits", count: buyers }];

  const M = (msgs.data as any[]) || [], AF = (aff.data as any[]) || [], PO = (payouts.data as any[]) || [], AP = (apps.data as any[]) || [];
  const alerts = { messages: M.filter((m) => m.status === "new").length, partners: AF.filter((a) => a.status === "pending").length, payouts: PO.filter((p) => p.status === "requested").length, hiring: AP.filter((a) => ["applied", "submitted"].includes(a.status)).length };

  const insights: { tone: "good" | "warn" | "info"; text: string }[] = [];
  if (span) {
    const d = pct(signups, signupsPrev);
    insights.push({ tone: d >= 0 ? "good" : "warn", text: `Signups are ${d >= 0 ? "up" : "down"} ${Math.abs(d)}% on the previous period (${signups} vs ${signupsPrev}).` });
  }
  if (signups > 0) insights.push({ tone: buyers ? "good" : "info", text: `${Math.round((tookAssess / signups) * 100)}% of new signups took an assessment and ${buyers} user${buyers === 1 ? "" : "s"} bought credits in this period.` });
  const busy = hours.indexOf(Math.max(...hours));
  if (Math.max(...hours) > 0) insights.push({ tone: "info", text: `Activity peaks around ${busy % 12 || 12}${busy < 12 ? "am" : "pm"} (Lagos time). Post and send reminders just before then.` });
  const t1 = top(tools, 1)[0]; if (t1) insights.push({ tone: "info", text: `Most used paid feature: ${t1.name.replace(/_/g, " ")} (${t1.count} uses).` });
  if (alerts.messages) insights.push({ tone: "warn", text: `${alerts.messages} contact message${alerts.messages === 1 ? "" : "s"} waiting for a reply.` });
  if (alerts.partners) insights.push({ tone: "warn", text: `${alerts.partners} partner${alerts.partners === 1 ? "" : "s"} waiting for approval.` });
  if (!insights.length) insights.push({ tone: "info", text: "Not enough activity in this period to draw conclusions yet." });

  const recent = P.slice().sort((a, b) => String(b.completed_at || b.created_at).localeCompare(String(a.completed_at || a.created_at))).slice(0, 8).map((p) => ({ amount: Number(p.amount), currency: p.currency, credits: p.credits, at: p.completed_at || p.created_at }));

  return NextResponse.json({
    range: { key, label: r.label, bucket, from: from ? new Date(from).toISOString().slice(0, 10) : null, to: new Date(to).toISOString().slice(0, 10) },
    totals: { users: U.length },
    kpis: {
      signups: { v: signups, p: signupsPrev }, active: { v: active, p: activePrev }, assessments: { v: assessN, p: assessPrev },
      buyers: { v: buyers, p: uniq(pp, "user_id") }, leads: { v: leadsN }, avgScore,
      revenue: money(pr), revenuePrev: money(pp),
    },
    series: { labels: keys, signups: series(U, "created_at"), active: series(E, "created_at"), assessments: series(A, "completed_at"), purchases: series(P, "completed_at") },
    hours, weekdays, funnel, topEvents: top(names), topTools: top(tools), recent, insights, alerts,
  }, { headers: { "Cache-Control": "no-store" } });
}
