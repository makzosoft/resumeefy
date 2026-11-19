export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, newId } from "@/lib/db";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { notifyAdmin, siteUrl } from "@/lib/mail";
import { logPartnerActivity } from "@/lib/partner-activity";
import { RESOURCES } from "@/lib/partner-resources";
import { logEvent, sendGroupInvite, type Job } from "@/lib/hiring";
import { decryptText, encryptText, hashPassword, idFromToken, makeCode, makeToken, maskAccount, maskEmail, minPayout, partnerReady, round2, verifyPassword } from "@/lib/partner";

const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const D = 86400000;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().max(25).refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid phone number."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(100),
  hire: z.string().trim().max(60).optional().default(""),
});

async function authed(req: NextRequest) {
  const id = idFromToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
  if (!id) return null;
  const { data } = await db.from("affiliates").select("*").eq("id", id).maybeSingle();
  if (!data || data.status === "suspended" || !data.email) return null;
  return data as any;
}

const publicPartner = (p: any) => ({
  id: p.id, name: p.full_name || p.display_name, email: p.email, phone: p.phone, status: p.status, code: p.code,
  rate: Number(p.commission_rate ?? 0.4),
  bank: { bankName: p.payout_bank_name || "", accountName: p.payout_account_name || "", accountMasked: maskAccount(decryptText(p.account_number_enc)), saved: !!p.account_number_enc },
});

async function dashboard(p: any) {
  const since = new Date(Date.now() - 29 * D).toISOString();
  const [clicks, attrs, comms, payouts] = await Promise.all([
    db.from("referral_clicks").select("source,created_at").eq("affiliate_id", p.id).order("created_at", { ascending: false }).limit(5000),
    db.from("affiliate_attributions").select("created_at,user_id,users(name,email)").eq("affiliate_id", p.id).order("created_at", { ascending: false }).limit(1000),
    db.from("affiliate_commissions").select("id,amount,currency,rate,status,paid_amount,user_id,created_at").eq("affiliate_id", p.id).order("created_at", { ascending: false }).limit(1000),
    db.from("affiliate_payout_requests").select("id,amount,currency,status,created_at,resolved_at").eq("affiliate_id", p.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const ck = (clicks.data as any[]) || [], at = (attrs.data as any[]) || [], cm = ((comms.data as any[]) || []).filter((c) => c.status !== "reversed"), po = (payouts.data as any[]) || [];

  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() - i * D).toISOString().slice(0, 10));
  const idx = Object.fromEntries(days.map((d, i) => [d, i]));
  const series = { clicks: new Array(30).fill(0), signups: new Array(30).fill(0) };
  for (const c of ck) { const i = idx[String(c.created_at).slice(0, 10)]; if (i !== undefined) series.clicks[i]++; }
  for (const a of at) { const i = idx[String(a.created_at).slice(0, 10)]; if (i !== undefined) series.signups[i]++; }

  const bySrc: Record<string, number> = {};
  for (const c of ck) if (c.created_at >= since) { const k = String(c.source || "direct").slice(0, 40); bySrc[k] = (bySrc[k] || 0) + 1; }

  const money: Record<string, { earned: number; available: number; paid: number }> = {};
  for (const c of cm) {
    const m = (money[c.currency] = money[c.currency] || { earned: 0, available: 0, paid: 0 });
    m.earned += Number(c.amount); m.paid += Number(c.paid_amount || 0); m.available += Number(c.amount) - Number(c.paid_amount || 0);
  }
  Object.values(money).forEach((m) => { m.earned = round2(m.earned); m.paid = round2(m.paid); m.available = round2(m.available); });

  const payers = new Set(cm.map((c) => c.user_id));
  const earnedBy: Record<string, number> = {};
  for (const c of cm) earnedBy[c.user_id] = (earnedBy[c.user_id] || 0) + Number(c.amount);
  return {
    partner: publicPartner(p),
    kpis: { clicks: ck.length, signups: at.length, paying: payers.size, conversion: at.length ? Math.round((payers.size / at.length) * 1000) / 10 : 0 },
    money, minPayout: Object.fromEntries(Object.keys(money).map((c) => [c, minPayout(c)])),
    series: { labels: days.map((d) => d.slice(5)), ...series },
    sources: Object.entries(bySrc).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits).slice(0, 8),
    referrals: at.slice(0, 200).map((a) => ({ name: a.users?.name || "Student", email: maskEmail(a.users?.email || ""), joined: a.created_at, status: payers.has(a.user_id) ? "Paid" : "Signed up", earned: round2(earnedBy[a.user_id] || 0) })),
    commissions: cm.slice(0, 100).map((c) => ({ id: c.id, amount: Number(c.amount), currency: c.currency, status: c.status, at: c.created_at })),
    payouts: po,
  };
}

export async function GET(req: NextRequest) {
  if (!partnerReady()) return err("Partner system is not configured yet.", 503);
  const p = await authed(req);
  if (!p) return err("Session expired. Please sign in again.", 401);
  if (req.nextUrl.searchParams.get("op") !== "me") return err("Unknown op.");
  if (p.status === "pending") return NextResponse.json({ pending: true, partner: publicPartner(p) });
  const stale = !p.last_login || Date.now() - new Date(p.last_login).getTime() > 30 * 60000;
  if (stale) {
    await db.from("affiliates").update({ last_login: new Date().toISOString(), inactivity_warned_at: null }).eq("id", p.id);
    await logPartnerActivity(p.id, "login", "returned to dashboard");
  }
  return NextResponse.json({ ...(await dashboard(p)), resources: RESOURCES }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!partnerReady()) return err("Partner system is not configured yet.", 503);
  const op = req.nextUrl.searchParams.get("op");
  const b = await req.json().catch(() => ({}));

  if (op === "signup") {
    const limited = rateLimit(`partner-signup:${clientKey(req)}`, 5, 3600_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);
    const parsed = signupSchema.safeParse(b);
    if (!parsed.success) return err(parsed.error.issues[0]?.message || "Check your details.");
    const d = parsed.data;
    const { data: exists } = await db.from("affiliates").select("id").eq("email", d.email).maybeSingle();
    if (exists) return err("A partner account with this email already exists.");
    // Someone approved through hiring signs up with their personal link and is activated straight away.
    let hired: { id: string; job_id: string; email: string; status: string } | null = null;
    if (d.hire) {
      const { data: ha } = await db.from("hiring_applications").select("id,job_id,email,status").eq("token", d.hire).maybeSingle();
      if (ha && (ha as any).status === "approved" && String((ha as any).email).toLowerCase() === d.email) hired = ha as any;
    }
    let created = false;
    for (let i = 0; i < 6 && !created; i++) {
      const { error } = await db.from("affiliates").insert({
        id: newId("aff"), email: d.email, full_name: d.name, display_name: d.name, phone: d.phone,
        password_hash: hashPassword(d.password), code: makeCode(), status: hired ? "active" : "pending", commission_rate: 0.4,
        ...(hired ? { approved_at: new Date().toISOString() } : {}),
      });
      if (!error) { created = true; break; }
      if (!/duplicate|unique/i.test(error.message) || /email/i.test(error.message)) return err("Could not create account.", 500);
    }
    if (!created) return err("Could not create account. Try again.", 500);
    if (hired) {
      await db.from("hiring_applications").update({ status: "joined", joined_at: new Date().toISOString() }).eq("id", hired.id);
      await logEvent(hired.job_id, hired.id, "joined", `${d.email} signed up as a partner and is active`);
      const { data: hj } = await db.from("hiring_jobs").select("*").eq("id", hired.job_id).maybeSingle();
      if (hj) await sendGroupInvite(hj as Job, { name: d.name, email: d.email });
      return NextResponse.json({ ok: true, message: "Your partner account is ready." });
    }
    await notifyAdmin("New partner waiting for your approval", { heading: "New partner to approve", paragraphs: ["A new partner has signed up and is waiting for approval."], rows: [["Name", d.name], ["Email", d.email], ["Phone", d.phone]] });
    return NextResponse.json({ ok: true, message: "Account created. We will review and approve it shortly." });
  }

  if (op === "login") {
    const email = String(b.email || "").toLowerCase().trim();
    const limited = rateLimit(`partner-login:${email}:${clientKey(req)}`, 8, 15 * 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);
    const { data: p } = await db.from("affiliates").select("*").eq("email", email).maybeSingle();
    if (!p || !verifyPassword(b.password, (p as any).password_hash)) return err("Incorrect email or password.", 401);
    if ((p as any).status === "suspended") return err("This account has been suspended. Contact Resumeefy.", 403);
    await db.from("affiliates").update({ last_login: new Date().toISOString(), last_seen: new Date().toISOString(), inactivity_warned_at: null }).eq("id", (p as any).id);
    await logPartnerActivity((p as any).id, "login");
    return NextResponse.json({ token: makeToken((p as any).id) });
  }

  const p = await authed(req);
  if (!p) return err("Session expired. Please sign in again.", 401);

  if (op === "track") {
    await logPartnerActivity(p.id, String(b.kind || ""), String(b.detail || ""));
    return NextResponse.json({ ok: true });
  }

  if (op === "bank") {
    const bankName = String(b.bankName || "").trim().slice(0, 60);
    const accountName = String(b.accountName || "").trim().slice(0, 80);
    const acct = String(b.accountNumber || "").replace(/\s/g, "");
    if (!bankName || accountName.length < 2) return err("Enter your bank and the account name.");
    if (!/^\d{10}$/.test(acct)) return err("Account number must be 10 digits.");
    await db.from("affiliates").update({ payout_bank_name: bankName, payout_account_name: accountName, account_number_enc: encryptText(acct), payout_account_number: maskAccount(acct) }).eq("id", p.id);
    return NextResponse.json({ ok: true, message: "Bank details saved." });
  }

  if (op === "password") {
    if (!verifyPassword(b.current, p.password_hash)) return err("Current password is wrong.", 401);
    if (String(b.next || "").length < 8) return err("New password must be at least 8 characters.");
    await db.from("affiliates").update({ password_hash: hashPassword(String(b.next)) }).eq("id", p.id);
    return NextResponse.json({ ok: true, message: "Password changed." });
  }

  if (op === "payout") {
    if (p.status !== "active") return err("Your account is not approved yet.", 403);
    if (!p.account_number_enc) return err("Add your bank details first.");
    const currency = String(b.currency || "").toUpperCase();
    const { data: open } = await db.from("affiliate_payout_requests").select("id").eq("affiliate_id", p.id).eq("currency", currency).eq("status", "requested").maybeSingle();
    if (open) return err("You already have a payout request waiting for this currency.");
    const rows = await db.from("affiliate_commissions").select("amount,paid_amount,status").eq("affiliate_id", p.id).eq("currency", currency).limit(2000);
    const total = round2(((rows.data as any[]) || []).filter((c) => ["pending", "approved"].includes(c.status)).reduce((s, c) => s + Number(c.amount) - Number(c.paid_amount || 0), 0));
    const min = minPayout(currency);
    if (total < min) return err(`Minimum payout is ${currency} ${min.toLocaleString()}. You have ${currency} ${total.toLocaleString()} available.`);
    const { error } = await db.from("affiliate_payout_requests").insert({ id: newId("payout"), affiliate_id: p.id, amount: total, currency, status: "requested" });
    if (error) return err("Could not create the request.", 500);
    await notifyAdmin("Partner payout requested", { heading: "Payout request", paragraphs: ["A partner has asked to be paid out."], rows: [["Partner", p.full_name || p.display_name], ["Email", p.email], ["Amount", `${currency} ${total.toLocaleString()}`]], cta: { label: "Open admin", url: `${siteUrl()}/admin` } });
    return NextResponse.json({ ok: true, amount: total });
  }

  return err("Unknown op.");
}
