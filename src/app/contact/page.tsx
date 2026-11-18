"use client";

import Link from "next/link";
import { useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import "../landing.css";
import "./contact.css";

const TOPICS = ["Resume help", "Payments & credits", "Courses", "Partners", "Something else"];

function Ico({ d }: { d: string[] }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p) => <path key={p} d={p} />)}
    </svg>
  );
}

export default function ContactPage() {
  const [f, setF] = useState({ name: "", reply: "", topic: TOPICS[0], message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [error, setError] = useState("");
  const ready = f.message.trim().length >= 5;
  const set = (k: "name" | "reply" | "message" | "website") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, page: "/contact" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your message.");
      setState("sent");
      setF({ name: "", reply: "", topic: TOPICS[0], message: "", website: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
      setState("failed");
    }
  }

  return (
    <main id="main-content" className="lp">
      <section className="ct-hero">
        <div className="lp-wrap">
          <span className="eyebrow">Contact us</span>
          <h1>Talk to the Resumeefy team.</h1>
          <p>Questions about your resume, credits, courses or the partner program? Tell us what you need and we will reply.</p>
        </div>
      </section>

      <div className="lp-wrap ct-body">
        <div className="ct">
          <aside className="ct-side">
            <a className="ct-link" href="mailto:resumeefy@gmail.com">
              <span className="ct-ico"><Ico d={["M4 6h16v12H4z", "M4 7l8 6 8-6"]} /></span>
              <span><b>Email us</b><span className="s">resumeefy@gmail.com</span></span>
            </a>
            <a className="ct-link" href="/#community">
              <span className="ct-ico"><Ico d={["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"]} /></span>
              <span><b>Join the community</b><span className="s">Tips, openings and quick questions</span></span>
            </a>
            <Link className="ct-link" href="/partner">
              <span className="ct-ico"><Ico d={["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M3.5 19c.5-3 2.7-5 5.5-5s5 2 5.5 5", "M17 8v6M14 11h6"]} /></span>
              <span><b>Become a partner</b><span className="s">Earn 40% by sharing Resumeefy</span></span>
            </Link>
            <Link className="ct-link" href="/resume-analyzer">
              <span className="ct-ico"><Ico d={["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", "M14 3v5h5"]} /></span>
              <span><b>Check your resume</b><span className="s">Get a score and fixes in minutes</span></span>
            </Link>
            <p className="ct-fine">We read every message. For payment issues, include the email you signed up with.</p>
          </aside>

          <form className="ct-form" onSubmit={submit}>
            <h2>Send us a message</h2>
            <p className="sub">Tell us a little and we will get back to you.</p>

            <div className="ct-field">
              <span className="ct-lbl">What is this about?</span>
              <div className="ct-chips" role="radiogroup" aria-label="Topic">
                {TOPICS.map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={f.topic === t} className={`ct-chip${f.topic === t ? " on" : ""}`} onClick={() => setF({ ...f, topic: t })}>{t}</button>
                ))}
              </div>
            </div>

            <div className="ct-row">
              <div className="ct-field">
                <label className="ct-lbl" htmlFor="ct-name">Your name</label>
                <input id="ct-name" className="ct-in" placeholder="e.g. Chioma Okafor" value={f.name} onChange={set("name")} maxLength={80} autoComplete="name" />
              </div>
              <div className="ct-field">
                <label className="ct-lbl" htmlFor="ct-reply">Email or WhatsApp</label>
                <input id="ct-reply" className="ct-in" placeholder="How should we reach you?" value={f.reply} onChange={set("reply")} maxLength={80} />
              </div>
            </div>

            <div className="ct-field">
              <label className="ct-lbl" htmlFor="ct-msg">Your message</label>
              <textarea id="ct-msg" className="ct-in" placeholder="How can we help?" value={f.message} onChange={set("message")} maxLength={1500} />
              <span className="ct-count">{f.message.length}/1500</span>
            </div>

            <input className="ct-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.website} onChange={set("website")} />

            {state === "sent" && <div className="ct-msg ok" role="status">Message sent. Thank you, we will get back to you.</div>}
            {state === "failed" && <div className="ct-msg err" role="alert">{error}</div>}

            <button type="submit" className="ct-send" disabled={!ready || state === "sending"}>
              {state === "sending" ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
