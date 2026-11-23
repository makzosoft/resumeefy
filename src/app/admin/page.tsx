"use client";
import { useCallback, useEffect, useState } from "react";
import { api, CurrentUser } from "@/lib/client";
import Overview from "@/components/admin/Overview";
import Messages from "@/components/admin/Messages";
import Users from "@/components/admin/Users";
import Legacy from "@/components/admin/Legacy";

type Alerts = { messages: number; partners: number; payouts: number; hiring: number };
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "messages", label: "Messages" },
  { id: "users", label: "Users" },
  { id: "partners", label: "Partners" },
  { id: "blog", label: "Blog" },
  { id: "growth", label: "Growth" },
];

export default function AdminPage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("overview");
  const [alerts, setAlerts] = useState<Alerts>({ messages: 0, partners: 0, payouts: 0, hiring: 0 });
  const [bell, setBell] = useState(false);

  const choose = useCallback((id: string) => {
    setTab(id); setBell(false);
    try { window.history.replaceState(null, "", id === "overview" ? "/admin" : `/admin?tab=${id}`); } catch { /* ignore */ }
  }, []);
  const refresh = useCallback(() => { api<{ alerts: Alerts }>("/api/admin/dashboard?light=1").then((r) => setAlerts(r.alerts)).catch(() => {}); }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t);
    api<{ user: CurrentUser }>("/api/auth").then((r) => setUser(r.user)).finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (user?.role !== "admin") return;
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [user, refresh]);

  if (!loaded) return <div className="max-w-2xl mx-auto px-6 py-20 text-center">Checking your session…</div>;
  if (!user) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center"><p>Sign in with an admin account to view this page.</p><a href="/login?next=/admin" className="btn btn-primary mt-5 inline-flex">Log in</a></div>
  );
  if (user.role !== "admin") return <div className="max-w-2xl mx-auto px-6 py-20 text-center">This page is for admins only.</div>;

  const badge = (id: string) => (id === "messages" ? alerts.messages : id === "partners" ? alerts.partners + alerts.payouts + alerts.hiring : 0);
  const items: { text: string; tab: string }[] = [];
  if (alerts.messages) items.push({ text: `${alerts.messages} new contact message${alerts.messages === 1 ? "" : "s"}`, tab: "messages" });
  if (alerts.partners) items.push({ text: `${alerts.partners} partner${alerts.partners === 1 ? "" : "s"} waiting for approval`, tab: "partners" });
  if (alerts.payouts) items.push({ text: `${alerts.payouts} payout request${alerts.payouts === 1 ? "" : "s"}`, tab: "partners" });
  if (alerts.hiring) items.push({ text: `${alerts.hiring} hiring application${alerts.hiring === 1 ? "" : "s"} to review`, tab: "partners" });
  const total = items.length ? alerts.messages + alerts.partners + alerts.payouts + alerts.hiring : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="font-display text-3xl font-semibold">Admin</h1><p className="text-[var(--ink-soft)] mt-1 text-sm">Signed in as {user.name}</p></div>
        <div className="relative">
          <button className="card px-4 py-3 text-lg relative" onClick={() => setBell((b) => !b)} aria-label="Things needing attention">🔔{total > 0 && <i className="absolute -top-2 -right-2 not-italic text-[11px] font-bold bg-[var(--coral)] text-white rounded-full min-w-5 h-5 grid place-items-center px-1">{total > 9 ? "9+" : total}</i>}</button>
          {bell && (<>
            <div className="fixed inset-0 z-40" onClick={() => setBell(false)} aria-hidden="true" />
            <div className="card p-4 absolute right-0 mt-2 w-72 z-50 space-y-2"><b className="text-sm">Needs your attention</b>
              {items.length ? items.map((i, k) => <button key={k} className="block w-full text-left text-sm py-2 border-t border-[var(--line)]" onClick={() => choose(i.tab)}>{i.text}</button>) : <p className="text-sm text-[var(--ink-soft)]">All clear.</p>}</div></>)}
        </div>
      </div>

      <div className="flex gap-2 mt-6 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => { const n = badge(t.id); return (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => choose(t.id)} className={`relative whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-bold border ${tab === t.id ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "border-[var(--line)]"}`}>
            {t.label}{n > 0 && <i className="not-italic ml-2 text-[11px] bg-[var(--coral)] text-white rounded-full px-1.5 py-0.5">{n > 9 ? "9+" : n}</i>}
          </button>); })}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview />}
        {tab === "messages" && <Messages onChange={refresh} />}
        {tab === "users" && <Users />}
        {tab === "partners" && <Legacy part="partners" />}
        {tab === "blog" && <Legacy part="blog" />}
        {tab === "growth" && <Legacy part="growth" />}
      </div>
    </div>
  );
}
