import type { Metadata } from "next";
export const metadata: Metadata = { title: "Resume Analyzer", description: "Analyze your resume for ATS readability, clarity, relevance and evidence of achievement.", alternates: { canonical: "/resume-analyzer" } };
export default function Layout({children}:{children:React.ReactNode}){return children;}
