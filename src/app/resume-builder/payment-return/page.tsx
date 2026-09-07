"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";

function PaymentReturnInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");

  useEffect(() => {
    const txRef = params.get("tx_ref");
    const transactionId = params.get("transaction_id");
    const resumeId = params.get("resumeId");

    if (!txRef || !transactionId) {
      setStatus("failed");
      return;
    }

    api<{ status: string }>(`/api/payment?action=verify&tx_ref=${encodeURIComponent(txRef)}&transaction_id=${encodeURIComponent(transactionId)}`)
      .then((r) => {
        if (r.status === "successful") {
          setStatus("success");
          setTimeout(() => router.push(`/resume-builder?resumeId=${resumeId || ""}&unlocked=1`), 1200);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [params, router]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="card p-8">
        {status === "checking" && <p className="font-display text-xl">Confirming your payment…</p>}
        {status === "success" && <p className="font-display text-xl text-[#0a7f73]">Payment confirmed, unlocking your resume…</p>}
        {status === "failed" && (
          <>
            <p className="font-display text-xl text-[var(--coral)]">We couldn&apos;t confirm that payment</p>
            <a href="/resume-builder" className="btn btn-primary mt-5">Back to resume builder</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-24 text-center">Loading…</div>}>
      <PaymentReturnInner />
    </Suspense>
  );
}
