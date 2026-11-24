"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { CertData } from "@/lib/certificate-draw";
import { CertificateActions, CertificatePreview } from "@/components/CertificateView";

const COLORS = ["#0A2FCC", "#FFD700", "#00B4FC", "#ffffff", "#e64d63", "#12a77b"];

function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const P = Array.from({ length: 170 }, (_, i) => ({
      x: window.innerWidth * (0.2 + Math.random() * 0.6), y: window.innerHeight * 0.35, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4,
      s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: COLORS[i % COLORS.length], life: 0, delay: (i % 5) * 10,
    }));
    let raf = 0, t = 0;
    const tick = () => {
      t++; ctx.clearRect(0, 0, c.width, c.height);
      for (const p of P) {
        if (t < p.delay) continue;
        p.vy += 0.32; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 260);
        ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
      if (t < 300) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="cert-confetti" aria-hidden="true" />;
}

// Listens for a newly issued certificate anywhere in the app and celebrates it.
export default function CertificateCelebration() {
  const [cert, setCert] = useState<CertData | null>(null);
  useEffect(() => {
    async function onAward(e: Event) {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;
      try { const r = await api<{ certificate: CertData }>(`/api/certificate?id=${encodeURIComponent(id)}`); setCert(r.certificate); } catch { /* ignore */ }
    }
    window.addEventListener("resumeefy:certificate-awarded", onAward);
    return () => window.removeEventListener("resumeefy:certificate-awarded", onAward);
  }, []);
  if (!cert) return null;
  return (
    <div className="cert-backdrop" role="dialog" aria-modal="true" aria-label="Certificate earned">
      <Confetti />
      <div className="cert-modal">
        <h2>You earned a certificate!</h2>
        <p>Download it, share it on LinkedIn or come back to it any time from your home page.</p>
        <CertificatePreview cert={cert} />
        <CertificateActions cert={cert} />
        <div className="cert-row" style={{ marginTop: 6 }}>
          <Link className="cert-btn" href={`/certificate/${cert.id}`} onClick={() => setCert(null)}>Open certificate page</Link>
          <button className="cert-btn" onClick={() => setCert(null)}>Close</button>
        </div>
      </div>
    </div>
  );
}
