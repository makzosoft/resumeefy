"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, safeNext } from "@/lib/client";
import { DEMO_MODE_PUBLIC } from "@/lib/demo";

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/assessment");
  const affiliateSignup = params.get("affiliate") === "1";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkEmailMessage, setCheckEmailMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api<{ needsEmailConfirmation?: boolean; message?: string }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "signup", name, email, password, affiliateSignup }),
      });
      if (result.needsEmailConfirmation) {
        // This is a SUCCESS outcome, not an error — the account was created
        // and Supabase already sent a confirmation email. It must never be
        // rendered with the same styling as a failed signup.
        setCheckEmailMessage(result.message || "Check your email to confirm your account, then sign in.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      if (code === "ALREADY_REGISTERED") {
        setError("An account with this email already exists.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  async function devSkip() {
    setDevLoading(true);
    try {
      await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "dev_skip" }) });
      window.dispatchEvent(new CustomEvent("resumeefy:signed-in"));
      router.push(next);
      router.refresh();
    } catch {
      setError("Dev bypass is not enabled on this build.");
    } finally {
      setDevLoading(false);
    }
  }

  if (checkEmailMessage) {
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="card p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Check your email</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-3">{checkEmailMessage}</p>
          <p className="text-sm text-[var(--ink-soft)] mt-6">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link href="/login" className="text-[var(--blue)] font-bold">
              try logging in
            </Link>{" "}
            once you&apos;ve confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-semibold text-center">
          {affiliateSignup ? "Join Resumeefy as an affiliate" : "Create your free account"}
        </h1>
        <p className="text-sm text-[var(--ink-soft)] text-center mt-2">
          {affiliateSignup
            ? "Get your referral code, dashboard and 40% commission tracking after signup."
            : "Takes 20 seconds, then straight into it."}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            className="input"
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-[var(--coral)]">{error}</p>}
          <button className="btn btn-primary w-full justify-center" disabled={loading}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>
        {DEMO_MODE_PUBLIC && (
          <button type="button" onClick={devSkip} disabled={devLoading} className="dev-bypass-btn">
            ⚡ {devLoading ? "Skipping…" : "Skip account creation (dev build only)"}
          </button>
        )}
        <p className="text-center text-sm text-[var(--ink-soft)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--blue)] font-bold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-20">Loading…</div>}>
      <SignupInner />
    </Suspense>
  );
}
