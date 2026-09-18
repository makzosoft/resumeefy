import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Advice, Resume Tips & Interview Guides | Resumeefy",
  description: "Practical resume, interview, job search and career readiness advice for ambitious job seekers in Nigeria and around the world.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Resumeefy Career Blog", description: "Practical career advice that helps you prepare, apply and perform better.", type: "website" },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) { return children; }
