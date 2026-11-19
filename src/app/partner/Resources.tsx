"use client";

import { useState } from "react";

export type Resource = { id: string; kind: "caption" | "file"; title: string; audience: string; note: string; text?: string; file?: string };

export default function Resources({ items, link, track }: { items: Resource[]; link: string; track: (kind: string, detail: string) => void }) {
  const [copied, setCopied] = useState("");
  const captions = items.filter((r) => r.kind === "caption");
  const files = items.filter((r) => r.kind === "file");

  function copy(r: Resource) {
    navigator.clipboard?.writeText((r.text || "").replaceAll("{link}", link));
    setCopied(r.id); setTimeout(() => setCopied(""), 1800);
    track("copy_caption", r.title);
  }

  return (
    <section className="pt-panel">
      <h2>Promo kit</h2>
      <p className="pt-note">Ready to post captions with your link already inside, plus logos and a demo video.</p>
      <div className="pt-two">
        {captions.map((r) => (
          <div key={r.id} className="pt-kpi" style={{ display: "grid", gap: 8 }}>
            <b style={{ fontSize: "1rem", letterSpacing: 0 }}>{r.title}</b>
            <span style={{ marginTop: 0 }}>{r.audience}. {r.note}</span>
            <p className="pt-note" style={{ whiteSpace: "pre-wrap", color: "var(--lp-text)" }}>{(r.text || "").replaceAll("{link}", link)}</p>
            <button className="pt-btn" onClick={() => copy(r)}>{copied === r.id ? "Copied" : "Copy caption"}</button>
          </div>
        ))}
      </div>
      <div className="pt-two">
        {files.map((r) => (
          <div key={r.id} className="pt-kpi" style={{ display: "grid", gap: 8 }}>
            <b style={{ fontSize: "1rem", letterSpacing: 0 }}>{r.title}</b>
            <span style={{ marginTop: 0 }}>{r.note}</span>
            <a className="pt-btn gold" style={{ display: "grid", placeItems: "center" }} href={r.file} download target="_blank" rel="noreferrer" onClick={() => track("resource_download", r.title)}>Download</a>
          </div>
        ))}
      </div>
    </section>
  );
}
