export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { clearSessionCookie, getCurrentSession, setAuthCookiesFromTokens, signIn, signUp } from "@/lib/auth";
import {
  createAffiliate,
  recordAffiliateAttribution,
  recordAffiliateLead,
  getActiveAffiliateLeadByEmail,
  trackEvent,
  recordUserReferral,
  completeUserReferral,
  claimDailyLoginReward,
} from "@/lib/data";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  affiliateSignup: z.boolean().optional(),
});

const confirmSchema = z.object({
  accessToken: z.string().min(10),
  refreshToken: z.string().min(4),
  type: z.string().optional(),
});

async function attachReferral(userId: string, email?: string) {
  const jar = await cookies();
  const affiliateCode = jar.get("resumeefy_referral")?.value;
  const inviteCode = jar.get("resumeefy_invite")?.value;

  if (affiliateCode) {
    if (email) await recordAffiliateLead(affiliateCode, email, userId).catch(() => {});
    await recordAffiliateAttribution(userId, affiliateCode).catch(() => {});
  } else if (email) {
    const lead = await getActiveAffiliateLeadByEmail(email).catch(() => undefined);
    if (lead?.affiliate_code) await recordAffiliateAttribution(userId, lead.affiliate_code).catch(() => {});
  }

  if (inviteCode && email) {
    await recordUserReferral(inviteCode, email, userId).catch(() => {});
    await completeUserReferral(userId, email, inviteCode).catch(() => {});
  } else if (email) {
    const { getUserInviteReferralByEmail } = await import("@/lib/data");
    const pending = await getUserInviteReferralByEmail(email).catch(() => undefined);
    if (pending?.invite_code) await completeUserReferral(userId, email, pending.invite_code).catch(() => {});
  }

  await claimDailyLoginReward(userId).catch(() => {});
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: session.sub, email: session.email, name: session.name, role: session.role },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action || "").toLowerCase();

  if (action === "logout") {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  if (action === "confirm") {
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid confirmation payload" }, { status: 400 });
    }
    await setAuthCookiesFromTokens(parsed.data.accessToken, parsed.data.refreshToken);
    const session = await getCurrentSession();
    if (session) {
      await attachReferral(session.sub, session.email);
      return NextResponse.json({
        ok: true,
        user: { id: session.sub, email: session.email, name: session.name, role: session.role },
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
    }
    try {
      const user = await signIn(parsed.data.email, parsed.data.password);
      const session = await getCurrentSession();
      if (!session) {
        return NextResponse.json({ error: "Account profile is not ready" }, { status: 500 });
      }
      trackEvent("login", { userId: user.id }).catch(() => {});
      await attachReferral(session.sub, session.email);
      return NextResponse.json({
        id: session.sub,
        name: session.name,
        email: session.email,
        role: session.role,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Incorrect email or password";
      return NextResponse.json({ error: message }, { status: 401 });
    }
  }

  if (action === "signup") {
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    try {
      const result = await signUp(parsed.data.email, parsed.data.password, parsed.data.name);

      if (!result.hasSession) {
        const jar = await cookies();
        const referralCode = jar.get("resumeefy_referral")?.value;
        if (referralCode) {
          await recordAffiliateLead(referralCode, parsed.data.email, result.user.id).catch(() => {});
        }
        const inviteCode = jar.get("resumeefy_invite")?.value;
        if (inviteCode) {
          await recordUserReferral(inviteCode, parsed.data.email, null).catch(() => {});
        }
        if (parsed.data.affiliateSignup) {
          await createAffiliate(result.user.id, parsed.data.name).catch(() => {});
        }
        return NextResponse.json({
          ok: true,
          needsEmailConfirmation: true,
          message: "Account created. Check your email to confirm your account, then sign in.",
        });
      }

      const session = await getCurrentSession();
      if (!session) {
        return NextResponse.json({ error: "Account profile is not ready" }, { status: 500 });
      }

      trackEvent("account_created", {
        userId: session.sub,
        meta: {
          email: parsed.data.email,
          affiliateSignup: Boolean(parsed.data.affiliateSignup),
        },
      }).catch(() => {});

      await attachReferral(session.sub, session.email);
      if (parsed.data.affiliateSignup) {
        await createAffiliate(session.sub, session.name);
      }

      return NextResponse.json({
        id: session.sub,
        name: session.name,
        email: session.email,
        role: session.role,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to create account";
      const lower = errorMessage.toLowerCase();

      const isDuplicate =
        lower.includes("already registered") ||
        lower.includes("already exists") ||
        lower.includes("duplicate") ||
        lower.includes("user already") ||
        lower.includes("email address is already");

      if (isDuplicate) {
        try {
          await signIn(parsed.data.email, parsed.data.password);
          const session = await getCurrentSession();
          if (session) {
            await attachReferral(session.sub, session.email);
            return NextResponse.json({
              id: session.sub,
              name: session.name,
              email: session.email,
              role: session.role,
            });
          }
        } catch {
          // fall through
        }
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }
  }

  return NextResponse.json({ error: "Unknown auth action" }, { status: 400 });
}
