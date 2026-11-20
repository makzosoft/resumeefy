// Best effort email sent through Gmail SMTP (or any SMTP host). Never throws.
// Turn it on with SMTP_USER (e.g. resumeefy@gmail.com) and SMTP_PASS (a Google App Password, not the normal password).
import tls from "node:tls";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").replace(/\/$/, "");
const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

function smtpSend(host: string, port: number, user: string, pass: string, to: string, subject: string, html: string): Promise<boolean> {
  return new Promise((resolve) => {
    let buf = "", pending: (() => void) | null = null, finished = false;
    const sock = tls.connect({ host, port, servername: host });
    const finish = (ok: boolean) => { if (finished) return; finished = true; try { sock.destroy(); } catch { /* ignore */ } resolve(ok); };
    sock.setTimeout(20000, () => finish(false));
    sock.on("error", () => finish(false));
    sock.on("data", (d) => { buf += d.toString("utf8"); pending?.(); });
    const read = () => new Promise<number>((res) => {
      const check = () => {
        const lines = buf.split("\r\n").filter(Boolean);
        const last = lines[lines.length - 1];
        if (last && /^\d{3} /.test(last) && buf.endsWith("\r\n")) { pending = null; buf = ""; res(Number(last.slice(0, 3))); }
      };
      pending = check; check();
    });
    const step = async (line: string | null, ok: number[]) => {
      if (line !== null) sock.write(line + "\r\n");
      const code = await read();
      if (!ok.includes(code)) throw new Error(`SMTP ${code}`);
    };
    (async () => {
      await new Promise<void>((r) => sock.once("secureConnect", () => r()));
      await step(null, [220]);
      await step("EHLO resumeefy", [250]);
      await step("AUTH LOGIN", [334]);
      await step(b64(user), [334]);
      await step(b64(pass), [235]);
      await step(`MAIL FROM:<${user}>`, [250]);
      await step(`RCPT TO:<${to}>`, [250, 251]);
      await step("DATA", [354]);
      const body = (b64(html).match(/.{1,76}/g) || []).join("\r\n");
      const msg = [`From: Resumeefy <${user}>`, `To: <${to}>`, `Subject: =?UTF-8?B?${b64(subject)}?=`, "MIME-Version: 1.0", "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", body].join("\r\n");
      sock.write(msg + "\r\n.\r\n");
      const code = await read();
      sock.write("QUIT\r\n");
      finish(code === 250);
    })().catch((e) => { console.warn("[mail]", (e as Error).message); finish(false); });
  });
}

export async function sendHtml(to: string, subject: string, html: string): Promise<boolean> {
  const user = process.env.SMTP_USER, pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
  const addr = String(to || "").trim();
  if (!user || !pass || !EMAIL_RE.test(addr)) return false;
  try {
    return await smtpSend(process.env.SMTP_HOST || "smtp.gmail.com", Number(process.env.SMTP_PORT) || 465, user, pass, addr, String(subject).replace(/[\r\n]+/g, " "), html);
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
