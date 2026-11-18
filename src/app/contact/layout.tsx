import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Resumeefy",
  description: "Questions about your resume, credits, courses or the partner program? Send the Resumeefy team a message.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
