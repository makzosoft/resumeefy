"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { analyzeResumeText } from "@/lib/questions";

function extractResumeText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const cleaned = raw
        .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (cleaned.length < 20) reject(new Error("Could not extract readable text"));
      else resolve(cleaned);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export default function ResumeAnalyzerPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeResumeText> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length < 12) {
        setAnalysis(null);
        return;
      }
      setAnalysis(analyzeResumeText(text.trim()));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [text]);

  async function upload(file: File) {
    setReading(true);
    setFileName(file.name);
    try {
      const extracted = await extractResumeText(file);
      setText(extracted);
    } catch {
      alert("We couldn't read that file directly. Try a .txt file or paste your resume below.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const scoreTone = analysis ? (analysis.score >= 75 ? "good" : "partial") : "";

  return (
    <main className="max-w-4xl mx-auto px-6 py-14">
      <div className="mb-7">
        <span className="inline-block bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-bold tracking-wide px-4 py-2 rounded-full">
          RESUME ANALYZER
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-semibold mt-4">Resume Analyzer</h1>
        <p className="text-[var(--ink-soft)] mt-2 max-w-2xl">
          Upload your resume or paste it below. Your score updates automatically as you type — no Analyze button, no timer, no pressure.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            className="hidden"
            aria-label="Upload your resume"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }}
          />
          <button className="btn btn-primary" type="button" onClick={() => fileRef.current?.click()} disabled={reading}>
            {reading ? "Reading resume…" : "Upload your resume"}
          </button>
          {fileName && <span className="text-xs text-[var(--ink-soft)] truncate max-w-[260px]" title={fileName}>{fileName}</span>}
        </div>

        <textarea
          className="input min-h-[360px] resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your resume here…\n\nFor example:\nProduct Manager with 4 years of experience...\nLed the redesign of...\nImproved conversion by 22%..."
          aria-label="Resume text to analyze"
        />
        <div className="flex justify-between text-xs text-[var(--ink-soft)] mt-2">
          <span>{words} words</span>
          <span>{words < 12 ? "Keep typing — analysis starts at 12 words" : "Analysing automatically…"}</span>
        </div>
      </div>

      {analysis && (
        <div className={`star-check show ${scoreTone} p-5`} aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold tracking-wide opacity-70">LIVE RESUME SCORE</div>
              <div className="font-display text-4xl font-semibold mt-1">{analysis.score}<span className="text-base">/100</span></div>
            </div>
            <div className="text-right text-sm font-bold">{analysis.score >= 75 ? "Strong start" : "Room to improve"}</div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {analysis.notes.map((note) => <p key={note}>• {note}</p>)}
          </div>
        </div>
      )}

      <div className="card p-6 mt-6 bg-[var(--paper-dim)]">
        <h2 className="font-display text-xl font-semibold">Ready to fix what you found?</h2>
        <p className="text-sm text-[var(--ink-soft)] mt-2">Turn your content into a properly laid out resume you can download.</p>
        <Link href="/resume-builder" className="btn btn-primary mt-4 inline-flex">Turn this into a real resume →</Link>
      </div>
    </main>
  );
}
