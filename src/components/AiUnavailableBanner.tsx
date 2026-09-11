"use client";

import { useEffect, useState } from "react";

export default function AiUnavailableBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => {
      console.log("[ai:browser] banner shown — AI temporarily unavailable");
      setOpen(true);
    };
    const hide = () => setOpen(false);
    window.addEventListener("resumeefy:ai-unavailable", show);
    window.addEventListener("resumeefy:ai-available", hide);
    return () => {
      window.removeEventListener("resumeefy:ai-unavailable", show);
      window.removeEventListener("resumeefy:ai-available", hide);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[90] max-w-md w-[calc(100%-2rem)] card p-4 flex items-start gap-3 shadow-xl"
    >
      <div className="text-xl leading-none">🤖</div>
      <div className="flex-1 text-sm">
        <b className="block">AI coach is taking a short break</b>
        <span className="text-[var(--ink-soft)]">
          Voice practice and manual features still work. Your credits were refunded. Please try again shortly.
        </span>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-lg leading-none"
        onClick={() => setOpen(false)}
      >
        ✕
      </button>
    </div>
  );
}