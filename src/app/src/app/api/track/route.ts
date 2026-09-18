export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import {
  createAffiliate,
  createAffiliatePayoutRequest,
  getAffiliateByCode,
  getAffiliateDashboard,
  getUserReferralStats,
  recordAffiliateAttribution,
  recordAffiliateClick,
  trackEvent,
  updateAffiliatePayoutAccount,
} from "@/lib/data";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Previously unbounded (z.record(unknown) with no size check), on a public,
// unauthenticated endpoint, written straight into Postgres and forwarded to
// an external webhook — an easy spot to dump arbitrarily large payloads.
const MAX_META_CHARS = 4000;
const schema = z.object({
  name: z.string().min(1).max(80),
  meta: z
    .record(z.string(), z.unknown())
    .optional()
    .refine((v) => !v || JSON.stringify(v).length <= MAX_META_CHARS, {
      message: `Event metadata is too large (max ${MAX_META_CHARS} characters once serialized).`,
    }),
});

const REFERRAL_MAX_AGE = 60 * 60 * 24 * 60;
const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function GET(req: NextRequest) {
  const action = (req.nextUrl.searchParams.get("action") || "").toLowerCase();

  if (action === "referral") {
    const limited = rateLimit(`track-referral:${clientKey(req)}`, 30, 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    const affiliate = code ? await getAffiliateByCode(code) : null;
    if (!affiliate || affiliate.status !== "active") {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }
    const jar = await cookies();
    const seenClick = jar.get("resumeefy_referral_seen")?.value === affiliate.code;
    if (!seenClick) {
      await recordAffiliateClick(
        code,
        req.nextUrl.searchParams.get("path") || "/refer",
        req.nextUrl.searchParams.get("source") || "direct",
        req.headers.get("user-agent") || undefined
      ).catch(() => {});
    }
    const session = await getCurrentSession().catch(() => null);
    if (session) await recordAffiliateAttribution(session.sub, affiliate.code).catch(() => {});
    await trackEvent("affiliate_referral_click", { userId: session?.sub ?? null, meta: { affiliateCode: affiliate.code } }).catch(() => {});

    const response = NextResponse.json({ ok: true, code: affiliate.code, affiliateName: affiliate.display_name });
    response.cookies.set("resumeefy_referral", affiliate.code, cookieOpts(REFERRAL_MAX_AGE));
    response.cookies.set("resumeefy_referral_seen", affiliate.code, cookieOpts(60 * 60 * 24));
    return response;
  }

  if (action === "affiliate_dashboard") {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    return NextResponse.json(await getAffiliateDashboard(session.sub));
  }

  if (action === "user_invite") {
    const limited = rateLimit(`track-invite:${clientKey(req)}`, 30, 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Invite code missing" }, { status: 400 });
    const { db } = await import("@/lib/db");
    const { data, error } = await db.from("users").select("id,name,invite_code").eq("invite_code", code).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Invite code not found" }, { status: 404 });

    const response = NextResponse.json({ ok: true, code: data.invite_code, inviterName: data.name });
    response.cookies.set("resumeefy_invite", data.invite_code, cookieOpts(60 * 60 * 24 * 60));
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
    if (result?.awarded) {
      await trackEvent("daily_login_reward", { userId: session.sub, meta: { credits: result.credits } }).catch(() => {});
    }
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
    if (accountNumber.length < 6 || accountNumber.length > 20) {
      return NextResponse.json({ error: "Enter a valid account number" }, { status: 400 });
    }
    const affiliate = await updateAffiliatePayoutAccount(session.sub, { accountNumber, accountName, bankName });
    await trackEvent("affiliate_payout_account_updated", { userId: session.sub, meta: { bankName: bankName || null } }).catch(() => {});
    return NextResponse.json({ affiliate });
  }

  if (action === "affiliate_payout") {
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const amount = Number(body?.amount);
    const currency = String(body?.currency || "USD").toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid payout amount" }, { status: 400 });
    }
    await createAffiliatePayoutRequest(session.sub, amount, currency);
    await trackEvent("affiliate_payout_requested", { userId: session.sub, meta: { amount, currency } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // Generic analytics event — public and unauthenticated, so it gets both a
  // rate limit and a payload size cap (see MAX_META_CHARS above).
  const limited = rateLimit(`track-event:${clientKey(req)}`, 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid event" }, { status: 400 });
  await trackEvent(parsed.data.name, { userId: session?.sub ?? null, meta: parsed.data.meta });
  return NextResponse.json({ ok: true });
}
