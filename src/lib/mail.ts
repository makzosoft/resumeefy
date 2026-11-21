// Best effort email through Gmail (or any SMTP host) using nodemailer. Never throws.
// Turn it on with SMTP_USER (e.g. resumeefy@gmail.com) and SMTP_PASS (a Google App Password, not the normal password).
import nodemailer, { type Transporter } from "nodemailer";
import { baseUrl } from "@/lib/site";
export const siteUrl = baseUrl;
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

let transport: Transporter | null = null;
function getTransport() {
  const user = process.env.SMTP_USER, pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
  if (!user || !pass) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465, auth: { user, pass },
      connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
    });
  }
  return transport;
}

export async function sendHtml(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransport();
  const addr = String(to || "").trim();
  if (!t || !EMAIL_RE.test(addr)) return false;
  try {
    await t.sendMail({ from: `Resumeefy <${process.env.SMTP_USER}>`, to: addr, subject: String(subject).replace(/[\r\n]+/g, " "), html });
    return true;
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
