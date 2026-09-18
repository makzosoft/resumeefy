export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getAdminStats } from "@/lib/data";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  return NextResponse.json(await getAdminStats());
}


export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (body?.action === "affiliate_payout_paid" && body?.payoutId) {
    const { markAffiliatePayoutPaid } = await import("@/lib/data");
    await markAffiliatePayoutPaid(String(body.payoutId));
    return NextResponse.json({ ok: true });
  }
  if (body?.action === "affiliate_status" && body?.affiliateId && ["active","suspended"].includes(String(body.status))) {
    const { setAffiliateStatus } = await import("@/lib/data");
    await setAffiliateStatus(String(body.affiliateId), String(body.status) as "active" | "suspended");
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid admin action" }, { status: 400 });
}
