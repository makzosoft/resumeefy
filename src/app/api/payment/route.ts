export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { getLocalizedCreditPacks } from "@/lib/pricing";
import { initiatePayment, isValidWebhookSignature, verifyTransaction } from "@/lib/flutterwave";
import { completeCreditPurchase, createCreditPurchase, failCreditPurchase, getAffiliateByCode, getCreditBalance, getCreditPurchase, trackEvent } from "@/lib/data";
import { newId } from "@/lib/db";
import { DEMO_MODE } from "@/lib/demo";

const buySchema = z.object({ packId: z.string().min(2) });
const spendSchema = z.object({ amount: z.number().int().positive().max(1000), feature: z.string().min(2), referenceId: z.string().optional() });

function countryOf(req: NextRequest) { return (req.headers.get("x-vercel-ip-country") || "NG").toUpperCase(); }

export async function GET(req: NextRequest) {
  const action = (req.nextUrl.searchParams.get("action") || "balance").toLowerCase();
  const session = await getCurrentSession();
  if (action === "pricing") {
    const pricing = await getLocalizedCreditPacks(countryOf(req));
    return NextResponse.json(pricing);
  }
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (action === "balance") return NextResponse.json(await getCreditBalance(session.sub));
  if (action === "verify") {
    const txRef = req.nextUrl.searchParams.get("tx_ref"); const transactionId = req.nextUrl.searchParams.get("transaction_id");
    if (!txRef || !transactionId) return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    const purchase = await getCreditPurchase(txRef); if (!purchase || purchase.user_id !== session.sub) return NextResponse.json({ error: "Unknown transaction" }, { status: 404 });
    if (purchase.status === "successful") return NextResponse.json({ status: "successful", balance: await getCreditBalance(session.sub) });
    if (DEMO_MODE) { await completeCreditPurchase(txRef); await trackEvent("credit_purchase_success", { userId: session.sub, meta: { txRef, credits: purchase.credits, demo: true } }); return NextResponse.json({ status: "successful", balance: await getCreditBalance(session.sub), demo: true }); }
    const verified = await verifyTransaction(transactionId);
    if (verified.status === "successful" && verified.amount >= Number(purchase.amount) && verified.currency === purchase.currency) {
      await completeCreditPurchase(txRef); await trackEvent("credit_purchase_success", { userId: session.sub, meta: { txRef, credits: purchase.credits } });
      return NextResponse.json({ status: "successful", balance: await getCreditBalance(session.sub) });
    }
    await failCreditPurchase(txRef); return NextResponse.json({ status: "failed" });
  }
  return NextResponse.json({ error: "Unknown payment action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const action = (req.nextUrl.searchParams.get("action") || "buy").toLowerCase();
  if (action === "webhook") {
    const signature = req.headers.get("verif-hash"); if (!isValidWebhookSignature(signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    const event = await req.json().catch(() => null); const txRef = event?.data?.tx_ref; const transactionId = event?.data?.id;
    if (!txRef || !transactionId) return NextResponse.json({ error: "Malformed webhook" }, { status: 400 });
    const purchase = await getCreditPurchase(String(txRef)); if (!purchase) return NextResponse.json({ error: "Unknown transaction" }, { status: 404 });
    const verified = await verifyTransaction(String(transactionId));
    if (verified.status === "successful" && verified.amount >= Number(purchase.amount) && verified.currency === purchase.currency) await completeCreditPurchase(String(txRef)); else await failCreditPurchase(String(txRef));
    return NextResponse.json({ ok: true });
  }
  const session = await getCurrentSession(); if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (action === "spend") {
    const parsed = spendSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Invalid credit spend" }, { status: 400 });
    try { const balance = await (await import("@/lib/data")).spendCredits(session.sub, parsed.data.amount, parsed.data.feature, parsed.data.referenceId); return NextResponse.json(balance); }
    catch (e) { if (String(e).includes("INSUFFICIENT_CREDITS")) return NextResponse.json({ error: "You have run out of credits.", code: "INSUFFICIENT_CREDITS" }, { status: 402 }); throw e; }
  }
  const parsed = buySchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Choose a valid credit pack" }, { status: 400 });
  const country = countryOf(req); const pricing = await getLocalizedCreditPacks(country); const pack = pricing.packs.find(p => p.id === parsed.data.packId);
  if (!pack) return NextResponse.json({ error: "Credit pack is not available for this location" }, { status: 400 });
  const jar = await cookies();
  const referralCode = jar.get("resumeefy_referral")?.value?.trim().toUpperCase();
  const affiliate = referralCode ? await getAffiliateByCode(referralCode) : null;
  const affiliateData = affiliate && affiliate.status === "active" ? { id: affiliate.id, code: affiliate.code, commission: Number((pack.amount * Number(affiliate.commission_rate || 0.40)).toFixed(2)) } : null;
  const txRef = newId("credits");
  try {
    await createCreditPurchase(session.sub, pack, txRef, affiliateData);
    if (DEMO_MODE) {
      await completeCreditPurchase(txRef);
      await trackEvent("credit_purchase_success", { userId: session.sub, meta: { txRef, credits: pack.credits, amount: pack.amount, currency: pack.currency, demo: true } });
      return NextResponse.json({ link: `${process.env.APP_URL || "http://localhost:3000"}/shop?demo_payment=success`, txRef, pack, affiliate: affiliate?.code ?? null, demo: true });
    }
    const paymentCountry = pricing.currency === "USD" && pricing.country !== "US" ? "NG" : pricing.country;
    const { link } = await initiatePayment({ txRef, amount: pack.amount, currency: pack.currency, country: paymentCountry, customerEmail: session.email, customerName: session.name, redirectPath: `/shop?payment=success&tx_ref=${encodeURIComponent(txRef)}` });
    await trackEvent("credit_purchase_initiated", { userId: session.sub, meta: { packId: pack.id, credits: pack.credits, amount: pack.amount, currency: pack.currency, country, affiliateCode: affiliate?.code ?? null } });
    return NextResponse.json({ link, txRef, pack, affiliate: affiliate?.code ?? null });
  } catch (err) { await failCreditPurchase(txRef).catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : "Payment could not be started" }, { status: 502 }); }
}
