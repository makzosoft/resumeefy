export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("resumeefy:credits-needed"));
    throw new Error((json as { error?: string }).error || "Something went wrong");
  }
  return json as T;
}

export function track(name: string, meta?: Record<string, unknown>) {
  api("/api/track", { method: "POST", body: JSON.stringify({ name, meta }) }).catch(() => {});
}

export type CurrentUser = { id: string; email: string; name: string; role: string } | null;
