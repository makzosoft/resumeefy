import { CREDIT_PACKS, INTERNATIONAL_CREDIT_PACKS } from "./data";

export type LocalizedPack = { id: string; credits: number; amount: number; currency: string; label: string; rate?: number; sourceCurrency?: string };

const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", PT: "EUR", FI: "EUR", SE: "EUR", DK: "EUR", PL: "EUR", NO: "EUR",
  GH: "GHS", KE: "KES", ZA: "ZAR", TZ: "TZS", UG: "UGX", RW: "RWF", CM: "XAF", CI: "XOF", SN: "XOF", ZM: "ZMW", MW: "MWK", EG: "EGP", SL: "SLL", IN: "INR", CO: "COP",
};

const FLUTTERWAVE_CURRENCIES = new Set(["USD", "CAD", "GBP", "EUR", "GHS", "KES", "ZAR", "TZS", "UGX", "RWF", "XAF", "XOF", "ZMW", "MWK", "EGP", "SLL", "INR", "COP"]);
const SYMBOLS: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€", CAD: "CA$", GHS: "GH₵", KES: "KSh", ZAR: "R", TZS: "TSh", UGX: "USh", RWF: "RF", XAF: "FCFA", XOF: "CFA", ZMW: "ZK", MWK: "MK", EGP: "E£", SLL: "Le", INR: "₹", COP: "COP" };

function roundLocal(value: number, currency: string) {
  if (currency === "JPY" || currency === "KRW") return Math.ceil(value / 100) * 100;
  if (["UGX", "TZS", "RWF", "XAF", "XOF", "SLL"].includes(currency)) return Math.ceil(value / 500) * 500;
  if (["INR", "GHS", "KES", "ZAR", "ZMW", "MWK", "EGP", "COP", "CAD"].includes(currency)) return Math.ceil(value / 10) * 10;
  return Math.ceil(value * 2) / 2;
}

async function usdRates(): Promise<Record<string, number>> {
  const fallback: Record<string, number> = { USD: 1, GBP: 0.75, EUR: 0.86, CAD: 1.37, GHS: 12, KES: 129, ZAR: 17, TZS: 2550, UGX: 3500, RWF: 1450, XAF: 560, XOF: 560, ZMW: 23, MWK: 1750, EGP: 48, SLL: 23000, INR: 88, COP: 3900 };
  try {
    const response = await fetch(process.env.EXCHANGE_RATE_API_URL || "https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    if (!response.ok) return fallback;
    const json = await response.json() as { rates?: Record<string, number> };
    return { ...fallback, ...(json.rates || {}) };
  } catch { return fallback; }
}

export async function getLocalizedCreditPacks(country = "NG"): Promise<{ country: string; currency: string; symbol: string; rate: number; packs: LocalizedPack[]; isNigeria: boolean; pricingSource: string }> {
  const normalized = country.toUpperCase();
  if (normalized === "NG") return { country: normalized, currency: "NGN", symbol: "₦", rate: 1, packs: CREDIT_PACKS, isNigeria: true, pricingSource: "Resumeefy Nigeria pricing" };
  const currency = COUNTRY_CURRENCY[normalized] && FLUTTERWAVE_CURRENCIES.has(COUNTRY_CURRENCY[normalized]) ? COUNTRY_CURRENCY[normalized] : "USD";
  const rates = await usdRates();
  const rate = Number(rates[currency] || 1);
  const packs = INTERNATIONAL_CREDIT_PACKS.map((pack) => ({
    id: `${currency.toLowerCase()}_${pack.credits}`,
    credits: pack.credits,
    amount: roundLocal(pack.amount * rate, currency),
    currency,
    label: pack.label,
    rate,
    sourceCurrency: "USD",
  }));
  return { country: normalized, currency, symbol: SYMBOLS[currency] || currency, rate, packs, isNigeria: false, pricingSource: "Live FX converted from international USD pricing" };
}
