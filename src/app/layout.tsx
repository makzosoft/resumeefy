import type { Metadata, Viewport } from "next";
import { baseUrl } from "@/lib/site";
import "./globals.css";
import "./fx.css";
import Nav from "@/components/Nav";
import ReferralCapture from "@/components/ReferralCapture";
import CreditGate from "@/components/CreditGate";
import AiUnavailableBanner from "@/components/AiUnavailableBanner";
import NewsletterModal from "@/components/NewsletterModal";
import FloatingCreditWidget from "@/components/FloatingCreditWidget";
import DailyRewardModal from "@/components/DailyRewardModal";
import CreditAwardFx from "@/components/CreditAwardFx";
import CertificateCelebration from "@/components/CertificateCelebration";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: { default: "Resumeefy | Better CV. Bigger Opportunities.", template: "%s | Resumeefy" },
  description:
    "Build a stronger resume, practise interviews, test career readiness and prepare for better opportunities with Resumeefy.",
  keywords: [
    "resume builder",
    "CV builder",
    "resume analyzer",
    "interview practice",
    "career assessment",
    "job readiness",
    "Nigeria jobs",
    "ATS resume",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Resumeefy",
    locale: "en_NG",
    url: "/",
    title: "Resumeefy | Better CV. Bigger Opportunities.",
    description: "Score your resume, practise interviews and prepare for better opportunities.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resumeefy | Better CV. Bigger Opportunities.",
    description: "Resume, interview and career readiness tools for ambitious job seekers.",
  },
};

export const viewport: Viewport = { themeColor: "#0A2FCC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('resumeefy_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Resumeefy",
              url: baseUrl(),
              logo: `${baseUrl()}/brand/resumeefy-mark.png`,
            }),
          }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ReferralCapture />
        <Nav />
        {children}
        <CreditGate />
        <AiUnavailableBanner />
        <NewsletterModal />
        <FloatingCreditWidget />
        <DailyRewardModal />
        <CreditAwardFx />
        <CertificateCelebration />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
