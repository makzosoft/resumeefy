"use client";
import { useCallback, useEffect, useState } from "react";
import { api, CurrentUser } from "@/lib/client";

type Partner = { id: string; full_name: string; email: string; phone: string; status: string; code: string; created_at: string; last_login: string | null; last_click: string | null; inactivity_warned_at: string | null; total_clicks: number; total_signups: number; total_sales: number };
type Job = { id: string; slug: string; title: string; description: string; commission_pct: number; open: boolean; apply_duration_h: number | null; research_duration_h: number | null; apply_deadline: string | null; research_deadline: string | null; auto_email: boolean; auto_approve: boolean; group_url: string };
type App = { id: string; job_id: string; name: string; email: string; whatsapp: string; why: string; status: string; research: string; created_at: string };
type Data = { partners: Partner[]; activity: { kind: string; detail: string; created_at: string; affiliates: { full_name: string; email: string } | null }[]; jobs: Job[]; applications: App[]; events: { id: string; job_id: string; type: string; text: string; created_at: string }[]; site: string };

const KIND: Record<string, string> = { login: "Logged in", copy_link: "Copied their link", copy_caption: "Copied a caption", resource_download: "Downloaded a file" };
const ago = (d: string | null) => { if (!d) return "never"; const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`; };
type Form = { id: string; title: string; description: string; commission_pct: number; apply_duration_h: number | null; research_duration_h: number | null; group_url: string; auto_email: boolean; auto_approve: boolean; open: boolean };
const blank: Form = { id: "", title: "", description: "", commission_pct: 40, apply_duration_h: 72, research_duration_h: 48, group_url: "", auto_email: true, auto_approve: false, open: true };

export default function AdminPartnersPage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [note, setNote] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => api<Data>("/api/admin/partners").then(setData).catch((e) => setNote(e.message)), []);
  useEffect(() => { api<{ user: CurrentUser }>("/api/auth").then((r) => setUser(r.user)).finally(() => setLoaded(true)); }, []);
  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  async function post(body: Record<string, unknown>, after?: () => void) {
    setNote("");
    try { const r = await api<{ message?: string }>("/api/admin/partners", { method: "POST", body: JSON.stringify(body) }); setNote(r.message || "Done."); after?.(); load(); }
    catch (e) { setNote((e as Error).message); }
  }

  if (!loaded) return <div className="max-w-2xl mx-auto px-6 py-20 text-center">Checking your session…</div>;
  if (!user || user.role !== "admin") return <div className="max-w-2xl mx-auto px-6 py-20 text-center">This page is for admins only.</div>;
  if (!data) return <div className="max-w-2xl mx-auto px-6 py-20 text-center">{note || "Loading…"}</div>;

  const pending = data.partners.filter((p) => p.status === "pending");
  const link = (j: Job) => `${data.site || window.location.origin}/hire/${j.slug}`;
  const btn = "text-[var(--blue)] font-bold text-xs mr-3";

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl font-semibold">Partners and hiring</h1>
      <p className="text-[var(--ink-soft)] mt-2">Approve partners, see what they do, and run hiring rounds. <a href="/admin" className="text-[var(--blue)] font-bold">Back to admin</a></p>
      {note && <div className="card p-4 mt-5 text-sm font-bold">{note}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[["Waiting for approval", pending.length], ["Active partners", data.partners.filter((p) => p.status === "active").length], ["Suspended", data.partners.filter((p) => p.status === "suspended").length], ["Open applications", data.applications.filter((a) => ["applied", "invited", "submitted"].includes(a.status)).length]].map(([l, v]) => (
          <div key={l as string} className="card p-5"><div className="text-xs font-bold text-[var(--ink-soft)]">{l}</div><div className="font-display text-2xl font-semibold mt-1">{v}</div></div>
        ))}
      </div>

      <div className="card p-6 mt-8">
        <h2 className="font-bold text-sm mb-3">Partners</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-[var(--ink-soft)]"><th className="py-2 pr-4">Partner</th><th className="py-2">Status</th><th className="py-2">Last login</th><th className="py-2">Last click</th><th className="py-2">Clicks / signups / sales</th><th className="py-2"></th></tr></thead><tbody>
          {data.partners.map((p) => (
            <tr key={p.id} className="border-t border-[var(--line)]">
              <td className="py-3 pr-4"><b>{p.full_name}</b><div className="text-xs text-[var(--ink-soft)]">{p.email} · {p.phone} · {p.code}</div></td>
              <td className="py-3">{p.status}{p.inactivity_warned_at ? " (warned)" : ""}</td>
              <td className="py-3">{ago(p.last_login)}</td><td className="py-3">{ago(p.last_click)}</td>
              <td className="py-3">{p.total_clicks} / {p.total_signups} / {p.total_sales}</td>
              <td className="py-3 text-right whitespace-nowrap">
                {p.status !== "active" && <button className={btn} onClick={() => post({ action: "partner_status", id: p.id, status: "active" })}>{p.status === "pending" ? "Approve" : "Reactivate"}</button>}
                {p.status !== "suspended" && <button className={btn} onClick={() => post({ action: "partner_status", id: p.id, status: "suspended" })}>Suspend</button>}
              </td>
            </tr>))}
          {!data.partners.length && <tr><td className="py-4 text-[var(--ink-soft)]" colSpan={6}>No partners yet.</td></tr>}
        </tbody></table></div>
        <p className="text-xs text-[var(--ink-soft)] mt-3">Partners with no login and no link click for 14 days get a warning email, and are suspended at 21 days.</p>
      </div>

      <div className="card p-6 mt-8">
        <h2 className="font-bold text-sm mb-3">Recent partner activity</h2>
        <div className="space-y-2 max-h-72 overflow-y-auto">{data.activity.map((a, i) => <div key={i} className="text-xs text-[var(--ink-soft)] border-b border-[var(--line)] py-2"><b className="text-[var(--ink)]">{a.affiliates?.full_name || a.affiliates?.email || "Partner"}</b> · {KIND[a.kind] || a.kind}{a.detail ? ` (${a.detail})` : ""} · {ago(a.created_at)}</div>)}{!data.activity.length && <div className="text-xs text-[var(--ink-soft)]">Nothing yet.</div>}</div>
      </div>

      <div className="card p-6 mt-8">
        <div className="flex items-center justify-between gap-4"><h2 className="font-bold text-sm">Hiring rounds</h2><button className="btn btn-primary !px-4 !py-2 text-xs" onClick={() => setForm({ ...blank })}>New job</button></div>
        {form && (
          <div className="mt-4 grid gap-3 border border-[var(--line)] rounded-2xl p-4">
            <input className="input" placeholder="Job title, e.g. Campus Promoter" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Short description shown on the application page" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
              <label>Commission %<input type="number" className="input mt-1" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })} /></label>
              <label>Applications open (hours)<input type="number" className="input mt-1" value={form.apply_duration_h ?? ""} onChange={(e) => setForm({ ...form, apply_duration_h: Number(e.target.value) })} /></label>
              <label>Research time (hours)<input type="number" className="input mt-1" value={form.research_duration_h ?? ""} onChange={(e) => setForm({ ...form, research_duration_h: Number(e.target.value) })} /></label>
              <label>Group chat link<input className="input mt-1" placeholder="https://..." value={form.group_url} onChange={(e) => setForm({ ...form, group_url: e.target.value })} /></label>
            </div>
            <label className="text-xs font-bold flex gap-2"><input type="checkbox" checked={form.auto_email} onChange={(e) => setForm({ ...form, auto_email: e.target.checked })} /> Email the research task as soon as someone applies</label>
            <label className="text-xs font-bold flex gap-2"><input type="checkbox" checked={form.auto_approve} onChange={(e) => setForm({ ...form, auto_approve: e.target.checked })} /> Approve everyone who sent research when the research time ends</label>
            <div className="flex gap-3"><button className="btn btn-primary !px-4 !py-2 text-xs" onClick={() => post({ action: "job_save", ...form }, () => setForm(null))}>{form.id ? "Save changes" : "Create job"}</button><button className={btn} onClick={() => setForm(null)}>Cancel</button></div>
            <p className="text-xs text-[var(--ink-soft)]">The timer starts the first time someone opens the job link.</p>
          </div>
        )}

        <div className="mt-5 space-y-4">{data.jobs.map((j) => {
          const apps = data.applications.filter((a) => a.job_id === j.id);
          return (
            <div key={j.id} className="border border-[var(--line)] rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><b>{j.title}</b> <span className="text-xs text-[var(--ink-soft)]">{j.open ? "open" : "closed"} · {j.commission_pct}% · {apps.length} application(s)</span>
                  <div className="text-xs mt-1 break-all"><a className="text-[var(--blue)] font-bold" href={link(j)} target="_blank" rel="noreferrer">{link(j)}</a></div>
                  <div className="text-xs text-[var(--ink-soft)] mt-1">{j.apply_deadline ? `Applications close ${new Date(j.apply_deadline).toLocaleString()}` : j.apply_duration_h ? `Timer starts when the link is first opened (${j.apply_duration_h}h)` : "No deadline"}{j.research_deadline ? ` · research due ${new Date(j.research_deadline).toLocaleString()}` : ""}</div></div>
                <div className="text-right text-xs whitespace-nowrap">
                  <button className={btn} onClick={() => navigator.clipboard?.writeText(link(j))}>Copy link</button>
                  <button className={btn} onClick={() => setForm({ ...blank, ...j, group_url: j.group_url || "" })}>Edit</button>
                  <button className={btn} onClick={() => post({ action: "job_invite_all", id: j.id })}>Send task to all</button>
                  <button className={btn} onClick={() => post({ action: "job_save", ...j, open: !j.open })}>{j.open ? "Close" : "Reopen"}</button>
                  <button className="text-[var(--coral)] font-bold text-xs" onClick={() => confirm("Delete this job and its applications?") && post({ action: "job_delete", id: j.id })}>Delete</button>
                </div>
              </div>
              <div className="mt-3 space-y-2">{apps.map((a) => (
                <div key={a.id} className="border-t border-[var(--line)] pt-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><b>{a.name}</b> <span className="text-xs text-[var(--ink-soft)]">{a.email} · {a.whatsapp} · {a.status}</span></div>
                    <div className="whitespace-nowrap">
                      <button className={btn} onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Hide" : "Read"}</button>
                      {["applied"].includes(a.status) && <button className={btn} onClick={() => post({ action: "app_action", id: a.id, what: "invite" })}>Send task</button>}
                      {["applied", "invited", "submitted"].includes(a.status) && <button className={btn} onClick={() => post({ action: "app_action", id: a.id, what: "approve" })}>Approve</button>}
                      {!["rejected", "joined"].includes(a.status) && <button className="text-[var(--coral)] font-bold text-xs" onClick={() => post({ action: "app_action", id: a.id, what: "reject" })}>Reject</button>}
                      {a.status === "rejected" && <button className={btn} onClick={() => post({ action: "app_action", id: a.id, what: "reset" })}>Move back</button>}
                    </div>
                  </div>
                  {open === a.id && <div className="mt-2 text-xs text-[var(--ink-soft)] whitespace-pre-wrap"><b>Why:</b> {a.why}{a.research ? `\n\nResearch:\n${a.research}` : "\n\nNo research sent yet."}</div>}
                </div>))}{!apps.length && <div className="text-xs text-[var(--ink-soft)]">No applications yet.</div>}</div>
            </div>);
        })}{!data.jobs.length && !form && <div className="text-xs text-[var(--ink-soft)]">No jobs yet. Create one and share its link.</div>}</div>

        {data.events.length > 0 && <div className="mt-6"><h3 className="font-bold text-xs mb-2">Hiring log</h3><div className="space-y-1 max-h-48 overflow-y-auto">{data.events.slice(0, 40).map((e) => <div key={e.id} className="text-xs text-[var(--ink-soft)]">{ago(e.created_at)} · {e.text}</div>)}</div></div>}
      </div>
    </div>
  );
}
