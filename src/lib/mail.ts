// Best effort email through Resend's HTTP API. Never throws. Set RESEND_API_KEY and FROM_EMAIL to turn it on.
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").replace(/\/$/, "");
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export async function sendHtml(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, from = process.env.FROM_EMAIL;
  if (!to || !key || !from) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `Resumeefy <${from}>`, to, subject, html }),
    });
    if (!r.ok) console.warn("[mail]", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) { console.warn("[mail]", (e as Error).message); return false; }
}

export type Shell = { heading: string; paragraphs?: string[]; rows?: [string, string][]; cta?: { label: string; url: string } };

export function emailShell(s: Shell): string {
  const rows = (s.rows || []).map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5d6b85;font-size:13px">${esc(k)}</td><td style="padding:6px 0;font-weight:700;font-size:14px">${esc(v)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#F3F6FD;font-family:Arial,Helvetica,sans-serif;color:#000B1D"><div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#0A2FCC;border-radius:18px 18px 0 0;padding:22px 26px;color:#fff;font-weight:800;font-size:20px">Resumeefy</div>
<div style="background:#fff;border-radius:0 0 18px 18px;padding:28px 26px">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">${esc(s.heading)}</h1>
${(s.paragraphs || []).map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${esc(p)}</p>`).join("")}
${rows ? `<table style="margin:6px 0 16px;border-collapse:collapse">${rows}</table>` : ""}
${s.cta ? `<a href="${esc(s.cta.url)}" style="display:inline-block;margin-top:6px;background:#FFD700;color:#000B1D;font-weight:800;text-decoration:none;padding:14px 24px;border-radius:12px">${esc(s.cta.label)}</a>` : ""}
</div><p style="text-align:center;color:#8a93a8;font-size:12px;margin-top:16px">Resumeefy. Better CV. Bigger Opportunities.</p></div></body></html>`;
}

// Heads up to the owner. Set ADMIN_NOTIFY_EMAIL to change who receives these.
export const notifyAdmin = (subject: string, s: Shell) =>
  sendHtml(process.env.ADMIN_NOTIFY_EMAIL || "resumeefy@gmail.com", subject, emailShell({ ...s, cta: s.cta || { label: "Open admin", url: `${siteUrl()}/admin/partners` } }));
