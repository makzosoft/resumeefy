import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Partner accounts are separate from student accounts. They sign in with their own email and password.
// PARTNER_SECRET signs sessions and encrypts bank details. Changing it signs everyone out and makes saved bank details unreadable.
const secret = () => process.env.PARTNER_SECRET || "";
export const partnerReady = () => secret().length >= 24;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `s1:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  const [v, salt, hash] = String(stored || "").split(":");
  if (v !== "s1" || !salt || !hash) return false;
  const a = scryptSync(String(password || ""), Buffer.from(salt, "hex"), 64);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const b64 = (b: Buffer) => b.toString("base64url");
const TTL = 30 * 24 * 3600 * 1000;

export function makeToken(id: string): string {
  const body = `${id}.${Date.now() + TTL}`;
  return `${b64(Buffer.from(body))}.${b64(createHmac("sha256", secret()).update(body).digest())}`;
}

export function idFromToken(token: string): string | null {
  try {
    const [p, sig] = String(token || "").split(".");
    const body = Buffer.from(p, "base64url").toString();
    const good = createHmac("sha256", secret()).update(body).digest();
    const given = Buffer.from(sig, "base64url");
    if (good.length !== given.length || !timingSafeEqual(good, given)) return null;
    const [id, exp] = body.split(".");
    return Number(exp) > Date.now() ? id : null;
  } catch { return null; }
}

const key = () => createHash("sha256").update(`bank:${secret()}`).digest();

export function encryptText(text: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map(b64).join(".");
}

export function decryptText(value: string | null | undefined): string {
  try {
    const [iv, tag, enc] = String(value || "").split(".").map((x) => Buffer.from(x, "base64url"));
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch { return ""; }
}

export function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "RESU" + Array.from(randomBytes(6), (b) => chars[b % chars.length]).join("");
}

export const maskEmail = (e: string) => {
  const [u, d] = String(e || "").split("@");
  return d ? `${u.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(4, u.length - 2)))}@${d}` : "";
};
export const maskAccount = (a: string) => (a ? `${"*".repeat(Math.max(0, a.length - 4))}${a.slice(-4)}` : "");
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const MIN_PAYOUT: Record<string, number> = { NGN: 5000 };
export const minPayout = (currency: string) => MIN_PAYOUT[currency.toUpperCase()] ?? 10;
