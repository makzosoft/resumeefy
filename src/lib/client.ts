export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const data = json as { error?: string; code?: string };
    if (typeof window !== "undefined") {
      if (res.status === 402) {
        console.warn("[ai:client] credits-needed event");
        window.dispatchEvent(new CustomEvent("resumeefy:credits-needed"));
      }
      if (res.status === 503 && data.code === "AI_QUOTA_EXHAUSTED") {
        console.warn("[ai:client] ai-unavailable event (all keys exhausted)");
        window.dispatchEvent(new CustomEvent("resumeefy:ai-unavailable"));
      }
      if (res.status === 503 && data.code === "AI_NOT_CONFIGURED") {
        console.warn("[ai:client] ai-unavailable event (not configured)");
        window.dispatchEvent(new CustomEvent("resumeefy:ai-unavailable"));
      }
    }
    // Attach the machine-readable code (and status) to the thrown Error so
    // callers can branch on specific failures (e.g. EMAIL_NOT_CONFIRMED)
    // instead of matching on message text.
    throw Object.assign(new Error(data.error || "Something went wrong"), { code: data.code, status: res.status });
  }
  return json as T;
}

export function track(name: string, meta?: Record<string, unknown>) {
  api("/api/track", { method: "POST", body: JSON.stringify({ name, meta }) }).catch(() => {});
}

export type CurrentUser = { id: string; email: string; name: string; role: string } | null;

/**
 * Only ever redirect to a same-origin, relative path. `next` query params are
 * attacker-controllable (anyone can send someone a link with ?next=...), so
 * an absolute or protocol-relative URL here must never be followed as-is.
 */
export function safeNext(value: string | null, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}