export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { clearSessionCookie, getCurrentSession, signIn, signUp } from "@/lib/auth";
import { createAffiliate, recordAffiliateAttribution, recordAffiliateLead, getActiveAffiliateLeadByEmail, trackEvent, recordUserReferral, completeUserReferral, claimDailyLoginReward } from "@/lib/data";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const signupSchema = z.object({ name: z.string().min(1, "Name is required"), email: z.string().email("Enter a valid email"), password: z.string().min(6, "Password must be at least 6 characters"), affiliateSignup: z.boolean().optional() });

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
    // The referral may have been captured before email confirmation.
    const { getUserInviteReferralByEmail } = await import("@/lib/data");
    const pending = await getUserInviteReferralByEmail(email).catch(() => undefined);
    if (pending?.invite_code) await completeUserReferral(userId, email, pending.invite_code).catch(() => {});
  }
  await claimDailyLoginReward(userId).catch(() => {});
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: session.sub, email: session.email, name: session.name, role: session.role } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const action = String(body?.action || "").toLowerCase();

  if (action === "logout") {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
    try {
      const user = await signIn(parsed.data.email, parsed.data.password);
      const session = await getCurrentSession();
      if (!session) return NextResponse.json({ error: "Account profile is not ready" }, { status: 500 });
      trackEvent("login", { userId: user.id }).catch(() => {});
      await attachReferral(session.sub, session.email);
      return NextResponse.json({ id: session.sub, name: session.name, email: session.email, role: session.role });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Incorrect email or password" }, { status: 401 });
    }
  }

  
if (action === "signup") {
  // ... existing validation ...
  try {
    const result = await signUp(...);
    // ... existing code ...
  } catch (error) {
    // Check if it's a duplicate email error
    if (error instanceof Error && error.message.includes("already registered")) {
      // Try to sign them in instead
      try {
        const loginResult = await signIn(parsed.data.email, parsed.data.password);
        const session = await getCurrentSession();
        // ... return session data ...
      } catch {
        return NextResponse.json({ 
          error: "Account exists but password is incorrect. Please log in." 
        }, { status: 409 });
      }
    }
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unable to create account" 
    }, { status: 409 });
  }
}
  
