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
  const [reward, setReward] = useState(1);
  const [flyingCoins, setFlyingCoins] = useState<{ id: number; dx: number; dy: number; delay: number }[]>([]);
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
      setReward(r.credits ?? 1);

      // Compute a flight path from the Claim button to the floating credit
      // widget so the coins visually arrive where the balance actually is.
      const target = document.getElementById("credit-widget-anchor");
      const btn = claimBtnRef.current;
      if (target && btn) {
        const from = btn.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const coins = Array.from({ length: 6 }, (_, i) => ({
          id: i,
          dx: to.left + to.width / 2 - (from.left + from.width / 2),
          dy: to.top + to.height / 2 - (from.top + from.height / 2),
          delay: i * 70,
        }));
        setFlyingCoins(coins);
      }
      setState("claimed");
      window.setTimeout(() => {
        if (typeof r.balance === "number") {
          window.dispatchEvent(new CustomEvent("resumeefy:credits-updated", { detail: { balance: r.balance } }));
        }
      }, 750);
      window.setTimeout(() => setOpen(false), 1500);
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
          <p>You've got a small credit waiting for signing in today.</p>
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
        {flyingCoins.map((c) => (
          <span
            key={c.id}
            className="daily-reward-flying-coin"
            style={{ ["--dx" as string]: `${c.dx}px`, ["--dy" as string]: `${c.dy}px`, animationDelay: `${c.delay}ms` }}
          >
            <CreditCoin size={18} />
          </span>
        ))}
      </div>
    </div>
  );
}
