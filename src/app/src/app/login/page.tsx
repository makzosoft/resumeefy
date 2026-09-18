"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, safeNext } from "@/lib/client";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/assessment");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsConfirmation(false);
    setResendState("idle");
    setLoading(true);
    try {
      await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "login", email, password }) });
      router.push(next);
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      setNeedsConfirmation(code === "EMAIL_NOT_CONFIRMED");
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResendState("sending");
    try {
      await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "resend_confirmation", email }) });
    } catch {
      // The endpoint intentionally always reports success either way.
    } finally {
      setResendState("sent");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-semibold text-center">Welcome back</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-[var(--coral)]">{error}</p>}
          {needsConfirmation && (
            <p className="text-sm text-[var(--ink-soft)]">
              {resendState === "sent" ? (
                "If that account needs confirming, a new email is on its way."
              ) : (
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendState === "sending"}
                  className="text-[var(--blue)] font-bold underline"
                >
                  {resendState === "sending" ? "Sending…" : "Resend confirmation email"}
                </button>
              )}
            </p>
          )}
          <button className="btn btn-primary w-full justify-center" disabled={loading}>
            {loading ? "Logging in…" : "Log in →"}
          </button>
        </form>
        <p className="text-center text-sm text-[var(--ink-soft)] mt-6">
          New here?{" "}
          <Link href="/signup" className="text-[var(--blue)] font-bold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-20">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
