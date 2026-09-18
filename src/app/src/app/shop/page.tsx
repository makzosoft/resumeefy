"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, track } from "@/lib/client";

type Pack = { id: string; credits: number; amount: number; currency: string; label: string; rate?: number };

function ShopInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState("");
  const [country, setCountry] = useState("NG");
  const [source, setSource] = useState("");
  const [returnStatus, setReturnStatus] = useState<"checking" | "success" | "failed" | null>(null);

  function refreshPricingAndBalance() {
    api<any>("/api/payment?action=pricing")
      .then((r) => {
        setPacks(r.packs);
        setCountry(r.country);
        setSource(r.pricingSource || "");
      })
      .catch(() => {});
    api<any>("/api/payment?action=balance")
      .then((r) => setBalance(r.balance))
      .catch(() => {});
  }

  useEffect(() => {
    refreshPricingAndBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Previously this page ignored the query params Flutterwave/our own
  // redirect_url come back with, so a purchase's completion depended
  // entirely on the webhook firing — with no feedback to the user and no
  // fallback if the webhook was delayed or never configured. This mirrors
  // the same verify-on-return flow already used elsewhere in the app.
  useEffect(() => {
    const demoPayment = params.get("demo_payment");
    const payment = params.get("payment");
    const txRef = params.get("tx_ref");
    const transactionId = params.get("transaction_id");

    if (demoPayment === "success") {
      setReturnStatus("success");
      refreshPricingAndBalance();
      router.replace("/shop");
      return;
    }

    if (payment === "success" && txRef && transactionId) {
      setReturnStatus("checking");
      api<{ status: string }>(`/api/payment?action=verify&tx_ref=${encodeURIComponent(txRef)}&transaction_id=${encodeURIComponent(transactionId)}`)
        .then((r) => {
          setReturnStatus(r.status === "successful" ? "success" : "failed");
          refreshPricingAndBalance();
        })
        .catch(() => setReturnStatus("failed"))
        .finally(() => router.replace("/shop"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function buy(id: string) {
    setLoading(id);
    try {
      const r = await api<any>("/api/payment", { method: "POST", body: JSON.stringify({ packId: id }) });
      track("credit_checkout", { packId: id });
      location.href = r.link;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not start payment");
      setLoading("");
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-14">
      <div className="text-center">
        <span className="section-label">RESUMEEFY SHOP</span>
        <h1 className="font-display text-4xl font-semibold mt-2">Buy credits. Use them everywhere.</h1>
        <p className="text-[var(--ink-soft)] mt-3 max-w-2xl mx-auto">
          Your signup credits are yours to enjoy. When they run out, choose a pack and keep moving. Nigeria has dedicated local
          pricing, while international pricing starts from the higher USD tier and is converted to supported local currencies
          using a refreshed FX rate.
        </p>
        <p className="text-xs text-[var(--ink-soft)] mt-2">{source}</p>
        <div className="inline-flex mt-5 rounded-full bg-[var(--blue-dim)] px-5 py-3 font-bold">Your balance: {balance} credits</div>

        {returnStatus === "checking" && <p className="text-sm text-[var(--ink-soft)] mt-4">Confirming your payment…</p>}
        {returnStatus === "success" && <p className="text-sm text-[#0a7f73] font-bold mt-4">Payment confirmed — credits added to your balance.</p>}
        {returnStatus === "failed" && (
          <p className="text-sm text-[var(--coral)] mt-4">
            We couldn&apos;t confirm that payment yet. If you were charged, it can take a minute to reflect — refresh this page shortly.
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {packs.map((p, i) => (
          <div key={p.id} className={`card p-6 ${i === 1 ? "ring-2 ring-[var(--blue)]" : ""}`}>
            <div className="text-xs font-bold text-[var(--blue)]">
              {p.label}
              {i === 1 && " · POPULAR"}
            </div>
            <div className="font-display text-3xl font-semibold mt-2">{p.credits}</div>
            <div className="text-sm text-[var(--ink-soft)]">credits</div>
            <div className="text-2xl font-bold mt-5">
              {p.currency} {p.amount.toLocaleString()}
            </div>
            {p.rate && (
              <div className="text-xs text-[var(--ink-soft)] mt-1">
                1 USD ≈ {Number(p.rate).toLocaleString()} {p.currency}
              </div>
            )}
            <button className="btn btn-primary w-full justify-center mt-5" disabled={!!loading} onClick={() => void buy(p.id)}>
              {loading === p.id ? "Opening checkout…" : "Buy credits"}
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-10">
        <h2 className="font-display text-xl font-semibold">What costs credits?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
          <span>AI resume · 20</span>
          <span>Job match · 10</span>
          <span>Desktop simulation · 20</span>
          <span>Interview feedback · 8</span>
          <span>Course generation · 25</span>
          <span>Course certificate · 40</span>
          <span>CV Boost · 100</span>
          <span>International CV · 220</span>
        </div>
      </div>
    </main>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<main className="max-w-6xl mx-auto px-6 py-14 text-center">Loading…</main>}>
      <ShopInner />
    </Suspense>
  );
}
