"use client";
import Link from "next/link";
import type { CertData } from "@/lib/certificate-draw";
import { CertificateActions } from "@/components/CertificateView";

export default function CertificateList({ certs }: { certs: CertData[] }) {
  return (
    <div className="cert-list">
      {certs.map((c) => (
        <div key={c.id} className="cert-item">
          <div className="cert-item-top">
            <span className="cert-medal" aria-hidden="true">🎓</span>
            <div><b>{c.course}</b><span>{new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {c.id}</span></div>
            <Link className="cert-btn sm" href={`/certificate/${c.id}`}>View</Link>
          </div>
          <CertificateActions cert={c} compact />
        </div>
      ))}
    </div>
  );
}
