import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCertificateById } from "@/lib/certificates";
import { CertificateActions, CertificatePreview } from "@/components/CertificateView";
import SiteFooter from "@/components/SiteFooter";
import "@/app/landing.css";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const c = await getCertificateById(id).catch(() => null);
  if (!c) return { title: "Certificate" };
  const title = `${c.name} completed ${c.course}`;
  const description = `Verified Resumeefy certificate. Resumeefy helps job seekers fix their resumes, practise interviews and prepare for better opportunities.`;
  return { title, description, openGraph: { type: "website", title, description, siteName: "Resumeefy", url: `/certificate/${c.id}` }, twitter: { card: "summary_large_image", title, description } };
}

export default async function CertificatePage({ params }: Params) {
  const { id } = await params;
  const cert = await getCertificateById(id).catch(() => null);
  if (!cert) notFound();
  return (
    <main id="main-content" className="lp">
      <section className="cert-hero">
        <div className="lp-wrap">
          <span className="cert-verified">✓ Verified certificate</span>
          <h1>{cert.name} completed {cert.course}</h1>
          <p>Issued on {new Date(cert.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Certificate ID {cert.id}.</p>
        </div>
      </section>
      <div className="lp-wrap cert-page">
        <div className="cert-frame"><CertificatePreview cert={cert} /></div>
        <CertificateActions cert={cert} />
        <div className="cert-cta">
          <div><b>Want one of your own?</b><span>Resumeefy helps you fix your resume, practise interviews and prove you are ready. Start free.</span></div>
          <Link href="/signup" className="lp-btn lp-btn-gold">Start free</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
