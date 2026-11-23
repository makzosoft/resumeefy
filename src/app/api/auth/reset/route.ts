export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, setAuthUserPassword } from "@/lib/auth";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { parseResetToken, resetSigValid } from "@/lib/reset";
import { hashPassword } from "@/lib/partner";

const err = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
const BAD = "This reset link is invalid or has expired. Please ask for a new one.";

export async function POST(req: NextRequest) {
  const limited = rateLimit(`reset:${clientKey(req)}`, 10, 3600_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterMs);
  const b = await req.json().catch(() => ({}));
  const password = String(b.password || "");
  if (password.length < 8 || password.length > 100) return err("Password must be at least 8 characters.");
  const t = parseResetToken(String(b.token || ""));
  if (!t) return err(BAD);

  if (t.kind === "u") {
    const u = await getAuthUser(t.id);
    if (!u || !resetSigValid(t, String(u.updated_at || ""))) return err(BAD);
    if (!(await setAuthUserPassword(t.id, password))) return err("Could not update the password. Please try again.", 500);
    return NextResponse.json({ ok: true });
  }

  const { data } = await db.from("affiliates").select("id,password_hash").eq("id", t.id).maybeSingle();
  if (!data || !(data as any).password_hash || !resetSigValid(t, (data as any).password_hash)) return err(BAD);
  await db.from("affiliates").update({ password_hash: hashPassword(password) }).eq("id", t.id);
  return NextResponse.json({ ok: true });
}
