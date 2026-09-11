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
    throw new Error(data.error || "Something went wrong");
  }
  return json as T;
}

export function track(name: string, meta?: Record<string, unknown>) {
  api("/api/track", { method: "POST", body: JSON.stringify({ name, meta }) }).catch(() => {});
}

export type CurrentUser = { id: string; email: string; name: string; role: string } | null;