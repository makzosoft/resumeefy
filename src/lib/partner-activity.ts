import { db, newId } from "@/lib/db";
import { emailShell, notifyAdmin, sendHtml, siteUrl } from "@/lib/mail";

export const D = 86400000;
export const WARN_AFTER_DAYS = 14;    // one week before suspension
export const SUSPEND_AFTER_DAYS = 21; // three weeks with no login and no link click
export const ACTIVITY_KINDS = ["login", "copy_link", "copy_caption", "resource_download"] as const;
export const KIND_LABEL: Record<string, string> = { login: "Logged in", copy_link: "Copied their link", copy_caption: "Copied a caption", resource_download: "Downloaded a file" };

export async function logPartnerActivity(partnerId: string, kind: string, detail = "") {
  try {
    if (!(ACTIVITY_KINDS as readonly string[]).includes(kind)) return;
    await db.from("partner_activity").insert({ id: newId("pa"), partner_id: partnerId, kind, detail: String(detail || "").slice(0, 120) });
    await db.from("affiliates").update({ last_seen: new Date().toISOString() }).eq("id", partnerId);
  } catch { /* best effort */ }
}

export async function lastClicks(sinceIso: string): Promise<Record<string, string>> {
  const { data } = await db.from("referral_clicks").select("affiliate_id,created_at").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(20000);
  const m: Record<string, string> = {};
  for (const r of (data as { affiliate_id: string; created_at: string }[]) || []) if (!m[r.affiliate_id]) m[r.affiliate_id] = r.created_at;
  return m;
}

type P = { id: string; email: string; full_name: string | null; code: string; created_at: string; approved_at: string | null; last_login: string | null; reactivated_at: string | null; inactivity_warned_at: string | null };
export const lastRealActivity = (p: P, click?: string) =>
  Math.max(0, ...[p.last_login, click, p.reactivated_at, p.approved_at || p.created_at].filter(Boolean).map((x) => new Date(x as string).getTime()));

// Warn at 14 idle days, suspend at 21, and never suspend anyone who has not been warned a week earlier.
export async function runPartnerInactivity() {
  const now = Date.now();
  const [{ data: partners }, clicks] = await Promise.all([
    db.from("affiliates").select("id,email,full_name,code,created_at,approved_at,last_login,reactivated_at,inactivity_warned_at").eq("status", "active").not("email", "is", null),
    lastClicks(new Date(now - 60 * D).toISOString()),
  ]);
  const warned: string[] = [], suspended: string[] = [];
  for (const p of (partners as P[]) || []) {
    const idle = (now - lastRealActivity(p, clicks[p.id])) / D;
    const name = (p.full_name || "there").split(" ")[0];
    if (idle < WARN_AFTER_DAYS) { if (p.inactivity_warned_at) await db.from("affiliates").update({ inactivity_warned_at: null }).eq("id", p.id); continue; }
    const warnedAt = p.inactivity_warned_at ? new Date(p.inactivity_warned_at).getTime() : 0;
    if (warnedAt && idle >= SUSPEND_AFTER_DAYS && now - warnedAt >= 7 * D - 3 * 3600000) {
      const { data: flipped } = await db.from("affiliates").update({ status: "suspended", auto_suspended_at: new Date().toISOString() }).eq("id", p.id).eq("status", "active").select("id");
      if (!(flipped as unknown[])?.length) continue;
      await sendHtml(p.email, "Your Resumeefy partner account has been suspended", emailShell({ heading: `Hi ${name}, your account is suspended`, paragraphs: [`We have not seen a login or a click on your link for ${Math.floor(idle)} days, so your partner account was suspended. Contact us any time and we will happily reactivate it.`], cta: { label: "Contact us", url: `${siteUrl()}/contact` } }));
      suspended.push(p.full_name || p.email);
    } else if (!warnedAt) {
      await db.from("affiliates").update({ inactivity_warned_at: new Date().toISOString() }).eq("id", p.id);
      await sendHtml(p.email, "Your Resumeefy partner account will be suspended in 7 days", emailShell({ heading: `Hi ${name}, we miss you`, paragraphs: [`There has been no login or click on your link for ${Math.floor(idle)} days. To keep your partner account, sign in or share your link within the next 7 days.`], cta: { label: "Open my dashboard", url: `${siteUrl()}/partner` } }));
      warned.push(p.full_name || p.email);
    }
  }
  if (warned.length) await notifyAdmin("Partners warned about inactivity", { heading: "Inactivity warning sent", paragraphs: [`${warned.length} partner(s) were emailed a one week warning: ${warned.join(", ")}.`] });
  if (suspended.length) await notifyAdmin("Partners suspended for inactivity", { heading: "Partner auto suspended", paragraphs: [`${suspended.length} partner(s) were suspended automatically: ${suspended.join(", ")}.`] });
  return { warned, suspended };
}
