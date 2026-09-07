export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { createAffiliate, createAffiliatePayoutRequest, getAffiliateByCode, getAffiliateDashboard, recordAffiliateAttribution, recordAffiliateClick, trackEvent, updateAffiliatePayoutAccount, getUserInviteProfile, getUserReferralStats } from "@/lib/data";

const schema = z.object({ name: z.string().min(1).max(80), meta: z.record(z.string(), z.unknown()).optional() });
const REFERRAL_MAX_AGE = 60 * 60 * 24 * 60;

export async function GET(req: NextRequest) {
  const action = (req.nextUrl.searchParams.get("action") || "").toLowerCase();
  if (action === "referral") {
    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    const affiliate = code ? await getAffiliateByCode(code) : null;
    if (!affiliate || affiliate.status !== "active") return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    const jar = await cookies();
    const seenClick = jar.get("resumeefy_referral_seen")?.value === affiliate.code;
    if (!seenClick) await recordAffiliateClick(code, req.nextUrl.searchParams.get("path") || "/refer", req.nextUrl.searchParams.get("source") || "direct", req.headers.get("user-agent") || undefined).catch(() => {});
    const session = await getCurrentSession().catch(() => null);
    if (session) await recordAffiliateAttribution(session.sub, affiliate.code).catch(() => {});
    await trackEvent("affiliate_referral_click", { userId: session?.sub ?? null, meta: { affiliateCode: affiliate.code } }).catch(() => {});
    const response = NextResponse.json({ ok: true, code: affiliate.code, affiliateName: affiliate.display_name });
    response.cookies.set("resumeefy_referral", affiliate.code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: REFERRAL_MAX_AGE });
    response.cookies.set("resumeefy_referral_seen", affiliate.code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
    return response;
  }
  if (action === "affiliate_dashboard") {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    return NextResponse.json(await getAffiliateDashboard(session.sub));
  }
  if (action === "user_invite") {
    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Invite code missing" }, { status: 400 });
    const { data, error } = await (await import("@/lib/db")).db.from("users").select("id,name,invite_code").eq("invite_code", code).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Invite code not found" }, { status: 404 });
    const response = NextResponse.json({ ok: true, code: data.invite_code, inviterName: data.name });
    response.cookies.set("resumeefy_invite", data.invite_code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
    return response;
  }
  if (action === "user_invite_dashboard") {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    return NextResponse.json(await getUserReferralStats(session.sub));
  }
  return NextResponse.json({ error: "Unknown tracking action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "event").toLowerCase();
  const session = await getCurrentSession();

  if (action === "daily_login_reward") {
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const { claimDailyLoginReward } = await import("@/lib/data");
    const result = await claimDailyLoginReward(session.sub);
    if (result?.awarded) await trackEvent("daily_login_reward", { userId: session.sub, meta: { credits: result.credits } }).catch(() => {});
    return NextResponse.json(result);
  }
  if (action === "affiliate_join") {
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const affiliate = await createAffiliate(session.sub, session.name);
    return NextResponse.json({ affiliate });
  }
  if (action === "affiliate_profile") {
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const accountNumber = String(body?.accountNumber || "").replace(/\D/g, "");
    const accountName = String(body?.accountName || "").trim();
    const bankName = String(body?.bankName || "").trim();
    if (accountNumber.length < 6 || accountNumber.length > 20) return NextResponse.json({ error: "Enter a valid account number" }, { status: 400 });
    const affiliate = await updateAffiliatePayoutAccount(session.sub, { accountNumber, accountName, bankName });
    await trackEvent("affiliate_payout_account_updated", { userId: session.sub, meta: { bankName: bankName || null } }).catch(() => {});
    return NextResponse.json({ affiliate });
  }
  if (action === "affiliate_payout") {
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const amount = Number(body?.amount); const currency = String(body?.currency || "USD").toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Enter a valid payout amount" }, { status: 400 });
    await createAffiliatePayoutRequest(session.sub, amount, currency);
    await trackEvent("affiliate_payout_requested", { userId: session.sub, meta: { amount, currency } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  await trackEvent(parsed.data.name, { userId: session?.sub ?? null, meta: parsed.data.meta });
  return NextResponse.json({ ok: true });
}
