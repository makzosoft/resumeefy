import { createHmac, timingSafeEqual } from "node:crypto";

// Password reset links. Each token is tied to the account's current password state,
// so it stops working as soon as the password is changed, and it expires after an hour.
const secret = () => process.env.PARTNER_SECRET || "";
export type ResetKind = "u" | "p"; // u = student or admin account, p = partner

export function makeResetToken(kind: ResetKind, id: string, fingerprint: string, ttlMs = 3600_000): string {
  const body = `${kind}.${id}.${Date.now() + ttlMs}`;
  const sig = createHmac("sha256", secret()).update(`${body}.${fingerprint}`).digest("base64url");
  return `${Buffer.from(body).toString("base64url")}.${sig}`;
}

export function parseResetToken(token: string): { kind: ResetKind; id: string; body: string; sig: string } | null {
  try {
    const [b, sig] = String(token || "").split(".");
    const body = Buffer.from(b, "base64url").toString();
    const [kind, id, exp] = body.split(".");
    if ((kind !== "u" && kind !== "p") || !id || Number(exp) < Date.now()) return null;
    return { kind, id, body, sig };
  } catch { return null; }
}

export function resetSigValid(t: { body: string; sig: string }, fingerprint: string): boolean {
  const good = createHmac("sha256", secret()).update(`${t.body}.${fingerprint}`).digest();
  const given = Buffer.from(t.sig, "base64url");
  return good.length === given.length && timingSafeEqual(good, given);
}
