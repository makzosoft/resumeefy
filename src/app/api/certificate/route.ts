export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCertificateById } from "@/lib/certificates";

// Public on purpose: anyone with a certificate ID can check that it is real. It never returns an email address.
export async function GET(req: NextRequest) {
  const cert = await getCertificateById(req.nextUrl.searchParams.get("id") || "");
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  return NextResponse.json({ certificate: cert }, { headers: { "Cache-Control": "no-store" } });
}
