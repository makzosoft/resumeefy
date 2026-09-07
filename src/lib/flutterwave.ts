import { DEMO_MODE } from "./demo";

// Real Flutterwave v3 Standard integration.
// Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
//
// Required env vars (see .env.example):
//   FLW_SECRET_KEY        - your Flutterwave secret key (test or live)
//   FLW_WEBHOOK_HASH       - the "secret hash" you set in your Flutterwave dashboard webhook settings
//   APP_URL                - the public base URL of this app, used for the redirect_url

const FLW_BASE = "https://api.flutterwave.com/v3";

function secretKey(): string {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new Error("FLW_SECRET_KEY is not set. Add it to .env.local (see .env.example).");
  return key;
}

export type InitiatePaymentInput = {
  txRef: string;
  amount: number;
  currency?: string;
  country?: string;
  customerEmail: string;
  customerName: string;
  redirectPath: string;
};

export async function initiatePayment(input: InitiatePaymentInput) {
  if (DEMO_MODE) return { link: `${process.env.APP_URL || "http://localhost:3000"}/shop?demo_payment=success&tx_ref=${encodeURIComponent(input.txRef)}` };
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency || "NGN",
      country: input.country || "NG",
      redirect_url: `${appUrl}${input.redirectPath}`,
      customer: {
        email: input.customerEmail,
        name: input.customerName,
      },
      customizations: {
        title: "Resumeefy Credits",
        description: "Credits for Resumeefy career tools, preparation and learning",
      },
    }),
  });

  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(json.message || "Flutterwave failed to initiate payment");
  }
  return json.data as { link: string };
}

export async function verifyTransaction(transactionId: string) {
  if (DEMO_MODE) return { id: Number(transactionId)||1, tx_ref: transactionId, amount: 0, currency: "NGN", status: "successful", customer: { email: "demo@resumeefy.local" } };
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(json.message || "Flutterwave verification request failed");
  }
  return json.data as {
    id: number;
    tx_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: { email: string };
  };
}

export function isValidWebhookSignature(headerHash: string | null): boolean {
  if (DEMO_MODE) return true;
  const expected = process.env.FLW_WEBHOOK_HASH;
  if (!expected || !headerHash) return false;
  return headerHash === expected;
}
