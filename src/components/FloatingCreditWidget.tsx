"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, CurrentUser } from "@/lib/client";
import { CreditCoin } from "@/components/CreditCoin";
import { useCreditEvents } from "@/components/useCreditEvents";

export default function FloatingCreditWidget() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    api<{ user: CurrentUser }>("/api/auth").then((r) => {
      setUser(r.user);
      if (r.user) api<{ balance: number }>("/api/payment?action=balance").then((x) => setBalance(x.balance)).catch(() => {});
    });
  }, []);

  useEffect(() => {
    function onSignedIn() {
      api<{ balance: number }>("/api/payment?action=balance").then((x) => setBalance(x.balance)).catch(() => {});
    }
    window.addEventListener("resumeefy:signed-in", onSignedIn);
    return () => {
      window.removeEventListener("resumeefy:signed-in", onSignedIn);
    };
  }, []);

  const onBump = useCallback(() => { setPulse(true); window.setTimeout(() => setPulse(false), 450); }, []);
  useCreditEvents(setBalance, onBump);

  if (!user || balance === null) return null;

  return (
    <button
      id="credit-widget-anchor"
      ref={ref}
      onClick={() => router.push("/shop")}
      className={`credit-widget ${pulse ? "credit-widget-pulse" : ""}`}
      aria-label={`${balance} credits — buy more`}
    >
      <CreditCoin size={22} />
      <span>{balance}</span>
    </button>
  );
}
