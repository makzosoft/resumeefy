"use client";

export const fmtN = (n: number) => Number(n || 0).toLocaleString();
export const money = (m: Record<string, number> | undefined) => {
  const e = Object.entries(m || {});
  return e.length ? e.map(([c, v]) => `${c} ${Math.round(v).toLocaleString()}`).join(" · ") : "0";
};
export const ago = (d: string | null | undefined) => {
  if (!d) return "never";
  const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
};

export function Delta({ v, p }: { v: number; p?: number }) {
  if (p === undefined) return null;
  const d = p ? Math.round(((v - p) / p) * 100) : v ? 100 : 0;
  const up = d >= 0;
  return <span className={`text-xs font-bold ml-2 ${up ? "text-[var(--green,#12a77b)]" : "text-[var(--coral)]"}`}>{up ? "▲" : "▼"} {Math.abs(d)}%</span>;
}

export function Kpi({ label, value, sub, v, p }: { label: string; value: string; sub?: string; v?: number; p?: number }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold text-[var(--ink-soft)]">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1">{value}{v !== undefined && <Delta v={v} p={p} />}</div>
      {sub && <div className="text-xs text-[var(--ink-soft)] mt-1">{sub}</div>}
    </div>
  );
}

export function Trend({ labels, values }: { labels: string[]; values: number[] }) {
  const W = 600, H = 150, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [values.length > 1 ? (i / (values.length - 1)) * W : W / 2, H - 8 - (v / max) * (H - 24)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="Trend chart" preserveAspectRatio="none">
        <polygon points={`0,${H} ${line} ${W},${H}`} fill="var(--blue)" opacity="0.12" />
        <polyline points={line} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[11px] text-[var(--ink-soft)] mt-1"><span>{labels[0]}</span><span>peak {fmtN(max)}</span><span>{labels[labels.length - 1]}</span></div>
    </div>
  );
}

export function Columns({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="flex items-end gap-[3px] h-32">{values.map((v, i) => <div key={i} title={`${labels[i]}: ${v}`} className="flex-1 rounded-t bg-[var(--blue)]" style={{ height: `${Math.max(2, (v / max) * 100)}%`, opacity: v === max ? 1 : 0.55 }} />)}</div>
      <div className="flex gap-[3px] text-[10px] text-[var(--ink-soft)] mt-1">{labels.map((l, i) => <span key={i} className="flex-1 text-center overflow-hidden">{values.length > 12 && i % 3 ? "" : l}</span>)}</div>
    </div>
  );
}

export function Bars({ data, empty = "Nothing yet." }: { data: { name: string; count: number }[]; empty?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <p className="text-sm text-[var(--ink-soft)]">{empty}</p>;
  return (
    <div className="space-y-2">{data.map((d) => (
      <div key={d.name}><div className="flex justify-between text-xs mb-1"><span>{d.name.replace(/_/g, " ")}</span><b>{fmtN(d.count)}</b></div><div className="h-2 rounded bg-[var(--line)]"><div className="h-2 rounded bg-[var(--blue)]" style={{ width: `${(d.count / max) * 100}%` }} /></div></div>
    ))}</div>
  );
}

export function Funnel({ steps }: { steps: { name: string; count: number }[] }) {
  const top = Math.max(1, steps[0]?.count || 1);
  return (
    <div className="space-y-3">{steps.map((s, i) => (
      <div key={s.name}><div className="flex justify-between text-xs mb-1"><span>{s.name}</span><b>{fmtN(s.count)}{i > 0 && steps[0].count ? ` · ${Math.round((s.count / top) * 100)}%` : ""}</b></div><div className="h-3 rounded bg-[var(--line)]"><div className="h-3 rounded" style={{ width: `${Math.max(2, (s.count / top) * 100)}%`, background: i === 0 ? "var(--blue)" : i === 1 ? "#4f7bff" : "var(--gold,#FFD700)" }} /></div></div>
    ))}</div>
  );
}
