"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ago } from "./charts";

type Msg = { id: string; topic: string; name: string; reply: string; message: string; status: string; created_at: string };
const STATUSES = ["new", "read", "replied", "archived"];

export default function Messages({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState("new");
  const [rows, setRows] = useState<Msg[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [reply, setReply] = useState<{ id: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => api<{ messages: Msg[]; counts: Record<string, number> }>(`/api/admin/messages?status=${status}`).then((r) => { setRows(r.messages); setCounts(r.counts); }).catch((e) => setNote(e.message)).finally(() => setLoading(false)), [status]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  async function act(body: Record<string, unknown>, done?: () => void) {
    setNote("");
    try { const r = await api<{ message?: string }>("/api/admin/messages", { method: "POST", body: JSON.stringify(body) }); if (r.message) setNote(r.message); done?.(); await load(); onChange(); }
    catch (e) { setNote((e as Error).message); }
  }
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phone = (v: string) => (v.replace(/\D/g, "").length >= 10 ? v.replace(/\D/g, "") : "");

  return (
    <div>
      <div className="flex flex-wrap gap-2">{STATUSES.map((s) => <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-full text-xs font-bold border capitalize ${status === s ? "bg-[var(--blue)] text-white border-[var(--blue)]" : "border-[var(--line)]"}`}>{s} · {counts[s] || 0}</button>)}</div>
      {note && <div className="card p-4 mt-4 text-sm font-bold">{note}</div>}
      <div className="mt-5 space-y-4">
        {loading ? <div className="card p-6">Loading…</div> : !rows.length ? <div className="card p-6 text-sm text-[var(--ink-soft)]">No {status} messages.</div> : rows.map((m) => (
          <div key={m.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[var(--blue)] text-white">{m.topic}</span> <b className="ml-2">{m.name || "No name"}</b>
                <div className="text-xs text-[var(--ink-soft)] mt-1">{m.reply ? (isEmail(m.reply) ? <a className="text-[var(--blue)] font-bold" href={`mailto:${m.reply}`}>{m.reply}</a> : phone(m.reply) ? <a className="text-[var(--blue)] font-bold" href={`https://wa.me/${phone(m.reply)}`} target="_blank" rel="noreferrer">{m.reply} (WhatsApp)</a> : m.reply) : "No contact left"} · {ago(m.created_at)}</div></div>
            </div>
            <p className="text-sm mt-3 whitespace-pre-wrap">{m.message}</p>
            {reply?.id === m.id && (
              <div className="mt-3 grid gap-2"><textarea className="input" rows={4} placeholder="Write your reply. It is emailed from resumeefy@gmail.com." value={reply.text} onChange={(e) => setReply({ id: m.id, text: e.target.value })} />
                <div className="flex gap-3"><button className="btn btn-primary !px-4 !py-2 text-xs" onClick={() => act({ action: "reply", id: m.id, text: reply.text }, () => setReply(null))}>Send reply</button><button className="text-xs font-bold" onClick={() => setReply(null)}>Cancel</button></div></div>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[var(--blue)]">
              {isEmail(m.reply) && <button onClick={() => setReply({ id: m.id, text: "" })}>Reply by email</button>}
              {m.status !== "read" && m.status !== "replied" && <button onClick={() => act({ action: "status", id: m.id, status: "read" })}>Mark read</button>}
              {m.status !== "replied" && <button onClick={() => act({ action: "status", id: m.id, status: "replied" })}>Mark replied</button>}
              {m.status !== "archived" ? <button onClick={() => act({ action: "status", id: m.id, status: "archived" })}>Archive</button> : <button onClick={() => act({ action: "status", id: m.id, status: "new" })}>Move to new</button>}
              <button className="text-[var(--coral)]" onClick={() => confirm("Delete this message for good?") && act({ action: "delete", id: m.id })}>Delete</button>
            </div>
          </div>))}
      </div>
    </div>
  );
}
