"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { CreditCoin } from "@/components/CreditCoin";

const SHOWN_KEY_PREFIX = "resumeefy_daily_reward_shown_";
const DELAY_MS = 30000;

function todayKey() {
  const d = new Date();
  return `${SHOWN_KEY_PREFIX}${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DailyRewardModal() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "claiming" | "claimed" | "already">("idle");
  const [reward, setReward] = useState(10);
  const claimBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onSignedIn() {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(todayKey())) return;
      const t = window.setTimeout(() => setOpen(true), DELAY_MS);
      return () => window.clearTimeout(t);
    }
    window.addEventListener("resumeefy:signed-in", onSignedIn);
    return () => window.removeEventListener("resumeefy:signed-in", onSignedIn);
  }, []);

  useEffect(() => {
    if (open) window.localStorage.setItem(todayKey(), "1");
  }, [open]);

  async function claim() {
    setState("claiming");
    try {
      const r = await api<{ awarded: boolean; credits?: number; balance?: number }>("/api/track", {
        method: "POST",
        body: JSON.stringify({ action: "daily_login_reward" }),
      });
      if (!r.awarded) {
        setState("already");
        return;
      }
      setReward(r.credits ?? 10);

      // Coins fly from the button to the credit total, which counts up as each one lands.
      const from = claimBtnRef.current?.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent("resumeefy:credits-award", { detail: { amount: r.credits ?? 10, balance: r.balance ?? 0, from } }));
      setState("claimed");
      window.setTimeout(() => setOpen(false), 2200);
    } catch {
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <div className="daily-reward-backdrop" role="dialog" aria-modal="true" aria-label="Daily reward">
      <div className="daily-reward-card">
        <div className="daily-reward-glow" />
        <CreditCoin size={56} />
        <h2>Welcome back!</h2>
        {state === "already" ? (
          <p>You've already claimed today's reward — come back tomorrow for more.</p>
        ) : state === "claimed" ? (
          <p className="daily-reward-success">+{reward} credit{reward === 1 ? "" : "s"} added!</p>
        ) : (
          <p>You've got 10 free credits waiting for signing in today.</p>
        )}
        {state === "idle" || state === "claiming" ? (
          <button ref={claimBtnRef} className="daily-reward-claim-btn" disabled={state === "claiming"} onClick={claim}>
            {state === "claiming" ? "Claiming…" : "Claim reward"}
          </button>
        ) : (
          <button className="daily-reward-claim-btn daily-reward-claim-btn-done" onClick={() => setOpen(false)}>
            Nice, thanks!
          </button>
        )}
      </div>
    </div>
  );
}
