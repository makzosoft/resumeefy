/**
 * Best-effort in-memory rate limiter.
 *
 * Counters live in the memory of a single serverless instance. Vercel can run
 * several instances of the same route concurrently, each with its own
 * counters, so this is not a strict distributed limit — a request spread
 * across instances/regions can exceed it. It still stops casual abuse and
 * single-instance hammering (a script hitting one warm instance repeatedly)
 * with no new infrastructure required.
 *
 * For a hard guarantee under real traffic, put these routes behind a shared
 * store instead (Upstash Redis, Vercel KV, etc.) — swap the implementation of
 * `rateLimit` below for one backed by that store; call sites do not need to
 * change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 20000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > MAX_TRACKED_KEYS) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }
    return { ok: true, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/** Best-effort caller identity from standard proxy headers (Vercel sets these). */
export function clientKey(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function tooManyRequests(retryAfterMs: number) {
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down and try again shortly." }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
    },
  });
}
