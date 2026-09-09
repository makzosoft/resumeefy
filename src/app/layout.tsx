import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ReferralCapture from "@/components/ReferralCapture";
import CreditGate from "@/components/CreditGate";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://resumeefy.com"),
  title: { default: "Resumeefy | Better CV. Bigger Opportunities.", template: "%s | Resumeefy" },
  description: "Build a stronger resume, practise interviews, test career readiness and prepare for better opportunities with Resumeefy.",
  keywords: ["resume builder", "CV builder", "resume analyzer", "interview practice", "career assessment", "job readiness", "Nigeria jobs", "ATS resume"],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Resumeefy", title: "Resumeefy | Better CV. Bigger Opportunities.", description: "Prepare smarter for the next opportunity with Resumeefy.", images: ["/brand/resumeefy-wordmark.png"] },
  twitter: { card: "summary_large_image", title: "Resumeefy | Better CV. Bigger Opportunities.", description: "Resume, interview and career readiness tools for ambitious job seekers." },
  icons: { icon: "/brand/resumeefy-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"Organization",name:"Resumeefy",url:process.env.NEXT_PUBLIC_SITE_URL||process.env.APP_URL||"https://resumeefy.com",logo:`${process.env.NEXT_PUBLIC_SITE_URL||process.env.APP_URL||"https://resumeefy.com"}/brand/resumeefy-mark.png`})}} />
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ReferralCapture />
        <Nav />
        {children}
        <CreditGate />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
