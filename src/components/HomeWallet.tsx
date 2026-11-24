"use client";
import { useCallback, useState } from "react";
import { useCreditEvents } from "@/components/useCreditEvents";

export default function HomeWallet({ initial }: { initial: number | null }) {
  const [balance, setBalance] = useState<number | null>(initial);
  const [bump, setBump] = useState(false);
  const onBump = useCallback(() => { setBump(true); window.setTimeout(() => setBump(false), 350); }, []);
  useCreditEvents(setBalance, onBump);
  return <b className={bump ? "uh-bump" : ""}>{balance === null ? "-" : balance}</b>;
}
