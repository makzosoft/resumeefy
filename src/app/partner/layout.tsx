import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resumeefy Partner Program",
  description: "Earn 40% commission by referring job seekers to Resumeefy. Get your personal link, track clicks and signups, and request payouts.",
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
