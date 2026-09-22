"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const DISMISS_KEY = "resumeefy_newsletter_dismissed";
const SHOW_AFTER_MS = 18000;

export default function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    const t = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  function dismiss() {
    setOpen(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify({ email, source: "newsletter" }) });
      setStatus("done");
      window.localStorage.setItem(DISMISS_KEY, "1");
      window.setTimeout(() => setOpen(false), 1800);
    } catch {
      setStatus("idle");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 newsletter-modal-backdrop" role="dialog" aria-modal="true" aria-label="Subscribe to the Resumeefy newsletter">
      <div className="card p-7 max-w-md w-full shadow-2xl newsletter-modal-card">
        <button className="newsletter-modal-close" aria-label="Close" onClick={dismiss}>
          ✕
        </button>
        <div className="text-xs font-bold text-[var(--blue)]">JOB ALERTS & CAREER TIPS</div>
        <h2 className="font-display text-2xl font-semibold mt-2">Get one useful email a week.</h2>
        <p className="text-sm text-[var(--ink-soft)] mt-2">
          New job openings, resume and interview tips, and Resumeefy updates. No fluff. Unsubscribe any time.
        </p>
        {status === "done" ? (
          <p className="text-sm font-bold text-[var(--mint)] mt-5">You&apos;re in — check your inbox soon.</p>
        ) : (
          <form onSubmit={submit} className="mt-5 flex gap-2 flex-col sm:flex-row">
            <input
              className="input"
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn btn-primary justify-center" disabled={status === "sending"}>
              {status === "sending" ? "Joining…" : "Subscribe"}
            </button>
          </form>
        )}
        <button className="text-xs text-[var(--ink-soft)] mt-4 underline" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
