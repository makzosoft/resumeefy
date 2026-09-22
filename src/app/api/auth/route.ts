export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { clearSessionCookie, getCurrentSession, resendConfirmation, setAuthCookiesFromTokens, signIn, signUp } from "@/lib/auth";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  createAffiliate,
  recordAffiliateAttribution,
  recordAffiliateLead,
  getActiveAffiliateLeadByEmail,
  trackEvent,
  recordUserReferral,
  completeUserReferral,
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
}

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error && "code" in error ? String((error as any).code) : undefined;
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

  // Dev-only shortcut for local testing: signs in as the fixed demo user
  // without touching Supabase at all. Gated on the server-only DEMO_MODE
  // flag (RESUMEEFY_DEMO_MODE=true) — with that unset, as it should be in
  // any real deployment, this 404s regardless of what the client sends.
  // Remove the env var (and the button that calls this) before shipping.
  if (action === "dev_skip") {
    const { DEMO_MODE, DEMO_NAME } = await import("@/lib/demo");
    if (!DEMO_MODE) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const user = await signIn("", "");
    return NextResponse.json({ id: user.id, name: DEMO_NAME, email: user.email, role: "user" });
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

  if (action === "resend_confirmation") {
    // Same bucket/limits as signup — this hits the same Supabase endpoint
    // shape and should not be usable to spam an inbox.
    const limited = rateLimit(`resend:${clientKey(req)}`, 5, 15 * 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

    const parsed = z.object({ email: z.string().email() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    await resendConfirmation(parsed.data.email).catch(() => {});
    // Always respond the same way regardless of whether the email exists or
    // is already confirmed, so this can't be used to check who has signed up.
    return NextResponse.json({ ok: true, message: "If that account needs confirming, a new email is on its way." });
  }

  if (action === "login") {
    // Login is the classic brute-force target: cap attempts per IP.
    const limited = rateLimit(`login:${clientKey(req)}`, 10, 5 * 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

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
      const code = errorCode(error);
      // Email-not-confirmed is a different situation from a wrong password —
      // the account exists, it just needs the link in the confirmation email
      // clicked first. Use 403 (recognized, not yet allowed) instead of 401.
      return NextResponse.json({ error: message, code }, { status: code === "EMAIL_NOT_CONFIRMED" ? 403 : 401 });
    }
  }

  if (action === "signup") {
    const limited = rateLimit(`signup:${clientKey(req)}`, 8, 15 * 60_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

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
      const isDuplicate = errorCode(error) === "ALREADY_REGISTERED";

      if (isDuplicate) {
        try {
          await signIn(parsed.data.email, parsed.data.password);
          const session = await getCurrentSession();
          if (session) {
            await attachReferral(session.sub, session.email);
            // Same as the non-duplicate signup path: honor a requested
            // affiliate signup even when the account already existed.
            if (parsed.data.affiliateSignup) {
              await createAffiliate(session.sub, session.name).catch(() => {});
            }
            return NextResponse.json({
              id: session.sub,
              name: session.name,
              email: session.email,
              role: session.role,
            });
          }
        } catch (signInError) {
          // Wrong password for an existing account, or the account needs
          // email confirmation — surface that instead of a generic 409.
          const code = errorCode(signInError);
          if (code === "EMAIL_NOT_CONFIRMED") {
            const message = signInError instanceof Error ? signInError.message : errorMessage;
            return NextResponse.json({ error: message, code }, { status: 403 });
          }
        }
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead.", code: "ALREADY_REGISTERED" },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: errorMessage, code: errorCode(error) }, { status: 409 });
    }
  }

  return NextResponse.json({ error: "Unknown auth action" }, { status: 400 });
}
