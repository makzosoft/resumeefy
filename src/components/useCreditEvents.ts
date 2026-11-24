"use client";
import { useEffect } from "react";

// Keeps a displayed credit balance in step with award animations and balance updates.
export function useCreditEvents(setBalance: (fn: (b: number | null) => number | null) => void, onBump: () => void) {
  useEffect(() => {
    const tick = (e: Event) => {
      const d = (e as CustomEvent<{ delta: number; final?: number }>).detail;
      setBalance((b) => (typeof d.final === "number" ? d.final : b === null ? b : Math.round(b + d.delta)));
      onBump();
    };
    const upd = (e: Event) => {
      const d = (e as CustomEvent<{ balance: number }>).detail;
      if (typeof d?.balance === "number") { setBalance(() => d.balance); onBump(); }
    };
    window.addEventListener("resumeefy:credits-tick", tick);
    window.addEventListener("resumeefy:credits-updated", upd);
    return () => { window.removeEventListener("resumeefy:credits-tick", tick); window.removeEventListener("resumeefy:credits-updated", upd); };
  }, [setBalance, onBump]);
}
