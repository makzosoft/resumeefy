export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, newId } from "@/lib/db";
import { notifyAdmin } from "@/lib/mail";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const CONTACT_TOPICS = ["Resume help", "Payments & credits", "Courses", "Partners", "Something else"] as const;

// Strip control characters and trim, same approach as the EliteScholars contact route.
const clean = (max: number) =>
  z.string().optional().default("").transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max));

const schema = z.object({
  topic: z.string().optional().default("Something else"),
  name: clean(80),
  reply: clean(80),
  message: clean(1500),
  page: clean(60),
  website: z.string().optional().default(""), // honeypot: real people never fill this in
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(`contact:${clientKey(req)}`, 5, 60 * 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check your message and try again." }, { status: 400 });
  const d = parsed.data;

  if (d.website) return NextResponse.json({ ok: true }); // bot: pretend it worked
  if (d.message.length < 5) return NextResponse.json({ error: "Please write a few words first." }, { status: 400 });

  const { error } = await db.from("contact_messages").insert({
    id: newId("msg"),
    topic: (CONTACT_TOPICS as readonly string[]).includes(d.topic) ? d.topic : "Something else",
    name: d.name,
    reply: d.reply,
    message: d.message,
    page: d.page || "/contact",
    status: "new",
  });
  if (error) {
    console.error("[contact]", error.message);
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }
  await notifyAdmin("New contact message", { heading: "New message from the Contact page", rows: [["Topic", d.topic], ["Name", d.name || "-"], ["Reply to", d.reply || "-"]], paragraphs: [d.message.slice(0, 600)], cta: { label: "Open the messages table", url: "https://supabase.com/dashboard/project/pclrswztvcmegvszxitj/editor" } });
  return NextResponse.json({ ok: true });
}
