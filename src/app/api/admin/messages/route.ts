export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailShell, sendHtml } from "@/lib/mail";

const err = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
async function admin() { const s = await getCurrentSession(); return s && s.role === "admin" ? s : null; }

export async function GET(req: NextRequest) {
  if (!(await admin())) return err("Admins only", 403);
  const status = req.nextUrl.searchParams.get("status") || "";
  let q = db.from("contact_messages").select("id,topic,name,reply,message,page,status,created_at").order("created_at", { ascending: false }).limit(300);
  if (["new", "read", "replied", "archived"].includes(status)) q = q.eq("status", status);
  const { data } = await q;
  const { data: all } = await db.from("contact_messages").select("status").limit(5000);
  const counts: Record<string, number> = { new: 0, read: 0, replied: 0, archived: 0 };
  ((all as any[]) || []).forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
  return NextResponse.json({ messages: data || [], counts }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await admin())) return err("Admins only", 403);
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!id) return err("Missing id");

  if (b.action === "status" && ["new", "read", "replied", "archived"].includes(String(b.status))) {
    await db.from("contact_messages").update({ status: b.status }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "delete") { await db.from("contact_messages").delete().eq("id", id); return NextResponse.json({ ok: true }); }

  if (b.action === "reply") {
    const text = String(b.text || "").trim().slice(0, 4000);
    if (text.length < 2) return err("Write your reply first.");
    const { data: m } = await db.from("contact_messages").select("*").eq("id", id).maybeSingle();
    if (!m) return err("Message not found", 404);
    const to = String((m as any).reply || "").trim();
    if (!EMAIL_RE.test(to)) return err("This person left a phone number, not an email. Reply on WhatsApp instead.");
    const ok = await sendHtml(to, "Re: your message to Resumeefy", emailShell({
      heading: `Hi ${String((m as any).name || "").split(" ")[0] || "there"}`,
      paragraphs: [...text.split(/\n{2,}/), `In reply to your message: "${String((m as any).message).slice(0, 300)}"`],
    }));
    if (!ok) return err("The email could not be sent. Check the email settings.", 502);
    await db.from("contact_messages").update({ status: "replied" }).eq("id", id);
    return NextResponse.json({ ok: true, message: "Reply sent." });
  }
  return err("Invalid action");
}
