"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ago } from "./charts";

type U = { id: string; name: string; email: string; role: string; created_at: string; balance: number; spent: number; assessments: number; purchases: number };

export default function Users() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ total: number; users: U[] } | null>(null);
  const [note, setNote] = useState("");
  const load = useCallback((term: string) => api<{ total: number; users: U[] }>(`/api/admin/users?q=${encodeURIComponent(term)}`).then(setData).catch((e) => setNote(e.message)), []);
  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q, load]);

  async function grant(u: U) {
    const v = window.prompt(`How many credits to add for ${u.email}?`, "20");
    if (!v) return;
    try { const r = await api<{ message: string }>("/api/admin/users", { method: "POST", body: JSON.stringify({ action: "grant", userId: u.id, amount: Number(v) }) }); setNote(r.message); load(q); }
    catch (e) { setNote((e as Error).message); }
  }

  return (
    <div>
      <input className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      {note && <div className="card p-4 mt-4 text-sm font-bold">{note}</div>}
      <div className="card p-5 mt-4">
        <div className="text-xs text-[var(--ink-soft)] mb-3">{data ? `${data.users.length} shown of ${data.total} users` : "Loading…"}</div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-[var(--ink-soft)]"><th className="py-2 pr-4">User</th><th className="py-2">Joined</th><th className="py-2">Credits</th><th className="py-2">Assessments</th><th className="py-2">Purchases</th><th className="py-2" /></tr></thead>
          <tbody>{data?.users.map((u) => (
            <tr key={u.id} className="border-t border-[var(--line)]"><td className="py-3 pr-4"><b>{u.name || "No name"}</b>{u.role === "admin" && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--blue)] text-white">admin</span>}<div className="text-xs text-[var(--ink-soft)]">{u.email}</div></td>
              <td className="py-3">{ago(u.created_at)}</td><td className="py-3">{u.balance}</td><td className="py-3">{u.assessments}</td><td className="py-3">{u.purchases}</td>
              <td className="py-3 text-right"><button className="text-[var(--blue)] font-bold text-xs" onClick={() => grant(u)}>Add credits</button></td></tr>))}
            {data && !data.users.length && <tr><td colSpan={6} className="py-4 text-[var(--ink-soft)]">No users match.</td></tr>}</tbody></table></div>
      </div>
    </div>
  );
}
