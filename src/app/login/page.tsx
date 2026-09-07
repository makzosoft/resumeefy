"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/assessment";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "login", email, password }) });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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
          <button className="btn btn-primary w-full justify-center" disabled={loading}>
            {loading ? "Logging in…" : "Log in →"}
          </button>
        </form>
        <p className="text-center text-sm text-[var(--ink-soft)] mt-6">
          New here? <Link href="/signup" className="text-[var(--blue)] font-bold">Create an account</Link>
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
