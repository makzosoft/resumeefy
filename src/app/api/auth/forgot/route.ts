export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findAuthUserByEmail } from "@/lib/auth";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { emailShell, sendHtml, siteUrl } from "@/lib/mail";
import { makeResetToken } from "@/lib/reset";
import { partnerReady } from "@/lib/partner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Always answers the same way so nobody can use this form to find out who has an account.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
  const type = b.type === "partner" ? "partner" : "user";
  const ok = NextResponse.json({ ok: true, message: "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder." });
  if (!EMAIL_RE.test(email) || !partnerReady()) return ok;

  const limited = rateLimit(`forgot:${clientKey(req)}`, 6, 3600_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterMs);
  if (!rateLimit(`forgot-email:${email}`, 3, 3600_000).ok) return ok;

  try {
    let token = "";
    let name = "";
    if (type === "partner") {
      const { data } = await db.from("affiliates").select("id,full_name,password_hash").eq("email", email).maybeSingle();
      if (data && (data as any).password_hash) { token = makeResetToken("p", (data as any).id, (data as any).password_hash); name = (data as any).full_name || ""; }
    } else {
      const u = await findAuthUserByEmail(email);
      if (u) { token = makeResetToken("u", u.id, String(u.updated_at || "")); }
    }
    if (token) {
      await sendHtml(email, "Reset your Resumeefy password", emailShell({
        heading: `Hi ${name.split(" ")[0] || "there"}, reset your password`,
        paragraphs: ["We got a request to reset your password. This link works for one hour and only once.", "If you did not ask for this, you can ignore this email. Your password will stay the same."],
        cta: { label: "Choose a new password", url: `${siteUrl()}/reset-password?t=${token}` },
      }));
    }
  } catch (e) { console.warn("[forgot]", (e as Error).message); }
  return ok;
}
