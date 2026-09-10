"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      setStatus("error");
      setMessage("This confirmation link is missing its tokens or has already been used.");
      return;
    }

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "confirm",
        accessToken,
        refreshToken,
        type: type || "signup",
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || "Confirmation failed");
        setStatus("done");
        setMessage("Email confirmed. Redirecting…");
        window.history.replaceState(null, "", "/auth/callback");
        setTimeout(() => router.push("/assessment"), 1200);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Confirmation failed");
      });
  }, [router]);

  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-semibold">
          {status === "working" && "Confirming your account…"}
          {status === "done" && "You're all set"}
          {status === "error" && "Confirmation problem"}
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-3">{message}</p>
        {status === "error" && (
          <a href="/login" className="btn btn-primary mt-6 inline-flex">
            Go to login
          </a>
        )}
      </div>
    </main>
  );
}
