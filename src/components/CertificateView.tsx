"use client";
import { useEffect, useRef, useState } from "react";
import { CertData, certCaption, drawCertificate, linkedInProfileUrl, linkedInShareUrl } from "@/lib/certificate-draw";

export function CertificatePreview({ cert }: { cert: CertData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawCertificate(ref.current, cert, window.location.origin); }, [cert]);
  return <canvas ref={ref} className="cert-canvas" role="img" aria-label={`Certificate for ${cert.name}: ${cert.course}`} />;
}

export function CertificateActions({ cert, compact = false }: { cert: CertData; compact?: boolean }) {
  const [note, setNote] = useState("");
  const origin = () => window.location.origin;
  const url = () => `${origin()}/certificate/${cert.id}`;
  const say = (t: string) => { setNote(t); window.setTimeout(() => setNote(""), 3500); };

  async function download() {
    const c = document.createElement("canvas");
    await drawCertificate(c, cert, origin());
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `Resumeefy-Certificate-${cert.name.replace(/[^A-Za-z0-9]+/g, "-")}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, "image/png");
  }
  async function linkedin() {
    const caption = certCaption(cert, url(), origin());
    try { await navigator.clipboard.writeText(caption); say("Caption copied. Paste it into your LinkedIn post."); } catch { say("Open LinkedIn and paste the caption from Copy caption."); }
    window.open(linkedInShareUrl(url()), "_blank", "noopener,noreferrer");
  }
  async function copy(text: string, msg: string) { try { await navigator.clipboard.writeText(text); say(msg); } catch { say("Could not copy. Select and copy it manually."); } }

  const b = compact ? "cert-btn sm" : "cert-btn";
  return (
    <div className="cert-actions">
      <div className="cert-row">
        <button className={`${b} primary`} onClick={download}>Download</button>
        <button className={`${b} li`} onClick={linkedin}>Share on LinkedIn</button>
        {!compact && <a className={b} href={linkedInProfileUrl(cert, url())} target="_blank" rel="noopener noreferrer">Add to LinkedIn profile</a>}
        <a className={b} href={`https://wa.me/?text=${encodeURIComponent(certCaption(cert, url(), origin()))}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        {!compact && <button className={b} onClick={() => copy(certCaption(cert, url(), origin()), "Caption copied.")}>Copy caption</button>}
        <button className={b} onClick={() => copy(url(), "Link copied.")}>Copy link</button>
      </div>
      {note && <p className="cert-note" role="status">{note}</p>}
    </div>
  );
}
