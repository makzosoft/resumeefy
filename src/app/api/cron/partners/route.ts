export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { processDue } from "@/lib/hiring";
import { runPartnerInactivity } from "@/lib/partner-activity";

// Daily job (see vercel.json). Vercel sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hiring = await processDue();
  const partners = await runPartnerInactivity();
  return NextResponse.json({ ok: true, hiring, partners });
}
