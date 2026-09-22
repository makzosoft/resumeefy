"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, CurrentUser } from "@/lib/client";
import { CreditCoin } from "@/components/CreditCoin";

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
    function onCreditsUpdated(e: Event) {
      const detail = (e as CustomEvent<{ balance: number }>).detail;
      if (typeof detail?.balance === "number") {
        setBalance(detail.balance);
        setPulse(true);
        window.setTimeout(() => setPulse(false), 700);
      }
    }
    window.addEventListener("resumeefy:signed-in", onSignedIn);
    window.addEventListener("resumeefy:credits-updated", onCreditsUpdated as EventListener);
    return () => {
      window.removeEventListener("resumeefy:signed-in", onSignedIn);
      window.removeEventListener("resumeefy:credits-updated", onCreditsUpdated as EventListener);
    };
  }, []);

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
