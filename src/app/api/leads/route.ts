export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveLead, trackEvent } from "@/lib/data";

const schema = z.object({
  email: z.string().email(),
  source: z.enum(["assessment_gate", "resume_gate", "newsletter"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  await saveLead(parsed.data.email, parsed.data.source);
  await trackEvent("email_captured", { meta: { email: parsed.data.email, source: parsed.data.source } });
  return NextResponse.json({ ok: true });
}
