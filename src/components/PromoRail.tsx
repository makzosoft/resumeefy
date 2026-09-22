"use client";
/**
 * Native, on-brand cross-promotion cards — used to surface other Resumeefy
 * tools (and the newsletter) inline on pages like the blog or resume
 * analyzer. Deliberately NOT styled like a third-party ad unit: no "Ad" or
 * "Sponsored" label, no boxed blue-link-on-white look, no external ad
 * network chrome. These are first-party links to Resumeefy's own pages, so
 * they're presented as on-brand recommendation cards instead.
 */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";

type Promo = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  tone: "blue" | "coral" | "mint" | "amber";
};

const PROMOS: Promo[] = [
  { id: "resume-builder", eyebrow: "RESUME BUILDER", title: "Build a resume in minutes.", text: "AI-generated, ATS-ready, tailored to the job you want.", cta: "Build my resume", href: "/resume-builder", tone: "blue" },
  { id: "resume-analyzer", eyebrow: "RESUME ANALYZER", title: "Not sure your CV is working?", text: "Get a free score and specific fixes in under a minute.", cta: "Analyze my resume", href: "/resume-analyzer", tone: "mint" },
  { id: "courses", eyebrow: "COURSES", title: "Learn the skills employers ask for.", text: "In-depth, instructor-led courses you can start free today.", cta: "Browse courses", href: "/courses", tone: "amber" },
  { id: "assessment", eyebrow: "INTERVIEW PREP", title: "Practice before it counts.", text: "Realistic interview, aptitude and workplace simulations.", cta: "Start free assessment", href: "/assessment", tone: "coral" },
];

function NewsletterPromoCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify({ email, source: "newsletter" }) });
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="promo-card promo-tone-blue">
      <span className="promo-eyebrow">NEWSLETTER</span>
      <h3>Job alerts and career tips, weekly.</h3>
      <p>New openings, resume and interview tips, and product updates. Unsubscribe any time.</p>
      {status === "done" ? (
        <p className="promo-done">You&apos;re in — check your inbox soon.</p>
      ) : (
        <form onSubmit={submit} className="promo-newsletter-form">
          <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={status === "sending"}>{status === "sending" ? "…" : "Join"}</button>
        </form>
      )}
    </div>
  );
}

export default function PromoRail({ exclude, includeNewsletter = true }: { exclude?: string; includeNewsletter?: boolean }) {
  const items = PROMOS.filter((p) => p.id !== exclude);
  return (
    <div className="promo-rail">
      {items.map((p) => (
        <Link key={p.id} href={p.href} className={`promo-card promo-tone-${p.tone}`}>
          <span className="promo-eyebrow">{p.eyebrow}</span>
          <h3>{p.title}</h3>
          <p>{p.text}</p>
          <span className="promo-cta">{p.cta} →</span>
        </Link>
      ))}
      {includeNewsletter && <NewsletterPromoCard />}
    </div>
  );
}
