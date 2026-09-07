"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, track, CurrentUser } from "@/lib/client";
import { analyzeResumeText } from "@/lib/questions";
import { RESUMEEFY_CV_RULES_VERSION } from "@/lib/resume-rules";

type ResumeData = {
  fullName: string;
  targetTitle: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  exp1: string;
  skills: string;
};

const sample: ResumeData = {
  fullName: "Ada Okafor",
  targetTitle: "Product Manager",
  email: "ada.okafor@email.com",
  phone: "+234 801 234 5678",
  location: "Lagos, Nigeria",
  summary:
    "Product manager with 4 years of experience shipping consumer fintech features. Turns complex problems into simple, usable products backed by data.",
  exp1: "Led the redesign of the onboarding flow, cutting signup drop-off by 22%. Shipped a savings feature now used by 40,000+ customers monthly.",
  skills: "Product strategy, User research, SQL, Figma, A/B testing",
};

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

function dataFromResumeText(text: string): Partial<ResumeData> {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const phone = text.match(/(\+?\d[\d \-]{7,}\d)/)?.[0]?.trim();
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const name = lines[0] && lines[0].length < 40 && !/@/.test(lines[0]) ? lines[0] : undefined;
  return {
    ...(name ? { fullName: name } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    summary: text.length > 700 ? `${text.slice(0, 700)}…` : text,
  };
}

function partialBlur(text: string, revealRatio: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const revealCount = Math.max(2, Math.round(words.length * revealRatio));
  return { visible: words.slice(0, revealCount).join(" "), hidden: words.slice(revealCount).join(" ") };
}

function ResumeBuilderInner() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<CurrentUser>(null);
  const [data, setData] = useState<ResumeData>(sample);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [tier, setTier] = useState<"boost" | "professional" | "executive" | "international">("boost");
  const [jobDescription, setJobDescription] = useState("");
  const [creditModal, setCreditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ experience: Array<{ company: string; role: string; dates: string; bullets: string[] }>; education: string[]; certifications: string[]; projects: string[]; qualityChecks: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ user: CurrentUser }>("/api/auth").then((r) => setUser(r.user));
  }, []);

  useEffect(() => {
    const idFromUrl = searchParams.get("resumeId");
    const unlockedFromUrl = searchParams.get("unlocked") === "1";
    if (!idFromUrl || !user) return;
    api<{ id: string; data: Partial<ResumeData>; isUnlocked: boolean }>(`/api/resume?id=${idFromUrl}`)
      .then((r) => {
        setResumeId(r.id);
        setData((d) => ({ ...d, ...r.data }));
        setUnlocked(r.isUnlocked || unlockedFromUrl);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      api<{ id: string }>("/api/resume", {
        method: "POST",
        body: JSON.stringify({ resumeId, data }),
      }).then((r) => setResumeId(r.id));
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user]);

  const analysis = data.summary.trim().split(/\s+/).filter(Boolean).length > 10 ? analyzeResumeText(data.summary) : null;

  function useSampleResume() {
    setData(sample);
    setFileName("");
    track("resume_sample_loaded");
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setFileName(file.name);
    try {
      const text = await extractResumeText(file);
      setData((current) => ({ ...current, ...dataFromResumeText(text) }));
      track("resume_uploaded", { fileType: file.name.split(".").pop() || "unknown" });
    } catch {
      setData(sample);
      track("resume_upload_fallback");
      alert("We couldn't read that file directly, so we've loaded a sample. You can edit the details below.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const tierCosts = { boost: 100, professional: 140, executive: 180, international: 220 };

  async function generateWithAI() {
    if (!user) { alert("Create a free account first so your generated CV can be saved."); return; }
    setGenerating(true);
    try {
      const result = await api<{ summary: string; experience: Array<{ company: string; role: string; dates: string; bullets: string[] }>; education: string[]; certifications: string[]; projects: string[]; skills: string[]; qualityChecks: string[] }>("/api/ai?action=resume", {
        method: "POST",
        body: JSON.stringify({ resume: data, jobDescription: jobDescription || undefined, tier }),
      });
      setData((current) => ({ ...current, summary: result.summary, exp1: result.experience.flatMap((e) => e.bullets).join("\n"), skills: result.skills.join(", ") }));
      setGenerated({ experience: result.experience, education: result.education, certifications: result.certifications, projects: result.projects, qualityChecks: result.qualityChecks });
      track("resume_ai_generated", { rulesVersion: RESUMEEFY_CV_RULES_VERSION });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not generate your CV. Check OPENAI_API_KEY and try again.");
    } finally { setGenerating(false); }
  }

  async function unlockWithCredits() {
    if (!user) { window.location.href = "/signup?next=/resume-builder"; return; }
    if (!resumeId) { alert("Give it a second to save your draft first, then try again."); return; }
    setPayLoading(true);
    try {
      await api("/api/resume", { method: "POST", body: JSON.stringify({ action: "unlock", resumeId, tier }) });
      setUnlocked(true);
      track("resume_unlocked", { tier, credits: tierCosts[tier] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "You need more credits.";
      if (message.toLowerCase().includes("credit")) setCreditModal(true); else alert(message);
    } finally { setPayLoading(false); }
  }

  const summaryParts = analysis ? partialBlur(data.summary, unlocked ? 1 : 0.6) : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl font-semibold">Build a Resume You Can Send Today</h1>
      <p className="sr-only" aria-label="Resumeefy CV writing standard">Resumeefy CV Standard {RESUMEEFY_CV_RULES_VERSION} is applied to generated resume content.</p>
      <p className="text-[var(--ink-soft)] mt-2">Upload your resume to pull in the details, load our sample to see it in action, or fill it in yourself.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          className="hidden"
          aria-label="Upload your resume"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleResumeUpload(file);
          }}
        />
        <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Reading resume…" : "Upload your resume"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={useSampleResume}>
          Use a sample instead
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void generateWithAI()} disabled={!user || generating}>
          {generating ? "Writing your CV…" : "Generate with AI →"}
        </button>
        {fileName && <span className="text-xs text-[var(--ink-soft)] truncate max-w-[240px]" title={fileName}>{fileName}</span>}
      </div>

      {!user && (
        <div className="card p-5 mt-6 bg-[var(--blue-dim)] border-none">
          <p className="text-sm font-bold">Create a free account to save and unlock your resume</p>
          <Link href="/signup?next=/resume-builder" className="btn btn-primary mt-3">Sign up free →</Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="card p-6 space-y-3">
          <input aria-label="Full name" className="input" placeholder="Full name" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} />
          <input aria-label="Target title" className="input" placeholder="Target title" value={data.targetTitle} onChange={(e) => setData({ ...data, targetTitle: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input aria-label="Email" className="input" placeholder="Email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
            <input aria-label="Phone" className="input" placeholder="Phone" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
          </div>
          <input aria-label="Location" className="input" placeholder="Location" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} />
                    <div className="mt-3">
            <div className="text-xs font-bold text-[var(--ink-soft)] mb-2">TARGET JOB DESCRIPTION <span className="font-normal">optional</span></div>
            <textarea aria-label="Optional job description" className="input min-h-[120px]" placeholder="Paste the job description here for sharper tailoring..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-[var(--ink-soft)] mb-2">RESUME STYLE</div>
            <div className="flex flex-wrap gap-2">{([['boost','CV Boost'],['professional','Professional'],['executive','Executive'],['international','International CV']] as const).map(([id,label]) => <button type="button" key={id} onClick={() => setTier(id)} className={`px-3 py-2 rounded-full text-xs font-bold border ${tier===id?'bg-[var(--blue)] text-white border-[var(--blue)]':'bg-white border-[var(--line)]'}`}>{label} · {tierCosts[id]} credits</button>)}</div>
          </div>
<textarea aria-label="Professional summary" className="input min-h-[100px]" placeholder="Summary" value={data.summary} onChange={(e) => setData({ ...data, summary: e.target.value })} />
          <textarea aria-label="Recent experience" className="input min-h-[80px]" placeholder="Recent experience" value={data.exp1} onChange={(e) => setData({ ...data, exp1: e.target.value })} />
          <input aria-label="Skills, comma separated" className="input" placeholder="Skills, comma separated" value={data.skills} onChange={(e) => setData({ ...data, skills: e.target.value })} />
        </div>

        <div className="relative">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-[#0A1E3D] to-[var(--ink)] text-white p-7">
              <div className="font-display text-2xl font-semibold">{data.fullName || "Your Name"}</div>
              <div className="text-[#9ee9ff] text-xs font-bold mt-1">{data.targetTitle || "Target Role"}</div>
              <div className={`text-[10px] mt-3 text-white/70 ${!unlocked ? "blur-[3px] select-none" : ""}`}>
                {data.email} · {data.phone} · {data.location}
              </div>
            </div>
            <div className="p-7 text-sm space-y-4">
              <div>
                <div className="text-[10px] font-bold text-[var(--blue)] tracking-wider mb-1">SUMMARY</div>
                <p>
                  {summaryParts?.visible}{" "}
                  {summaryParts?.hidden && <span className={!unlocked ? "blur-[3px] select-none" : ""}>{summaryParts.hidden}</span>}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--blue)] tracking-wider mb-1">EXPERIENCE</div>
                <p className={!unlocked ? "blur-[2px] select-none" : ""}>{data.exp1}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--blue)] tracking-wider mb-1">SKILLS</div>
                <div className="flex flex-wrap gap-2">
                  {data.skills.split(",").filter(Boolean).map((s) => (
                    <span key={s} className="bg-[var(--blue-dim)] text-[#0A2FCC] text-xs font-bold px-3 py-1 rounded-full">{s.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!unlocked && (
            <div className="mt-4 flex items-center justify-between bg-white border border-[var(--line)] rounded-xl p-4">
              <span className="text-xs font-bold text-[var(--ink-soft)]">Preview is watermarked</span>
              <button className="btn btn-primary text-sm" disabled={!user || payLoading} onClick={() => void unlockWithCredits()}>
                {payLoading ? "Unlocking…" : `Unlock ${tier === "boost" ? "CV Boost" : tier === "international" ? "International CV" : tier[0].toUpperCase()+tier.slice(1)} · ${tierCosts[tier]} credits`}
              </button>
            </div>
          )}
          {unlocked && (
            <div className="mt-4 bg-[var(--mint)]/10 text-[#087a9b] rounded-xl p-4 text-sm font-bold text-center">
              Unlocked, print this page to save as PDF.
            </div>
          )}
          {creditModal && <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-5" role="dialog" aria-modal="true">
            <div className="card p-7 max-w-md w-full shadow-2xl"><div className="text-xs font-bold text-[var(--blue)]">CREDITS NEEDED</div><h2 className="font-display text-2xl font-semibold mt-2">Your credits have run out.</h2><p className="text-sm text-[var(--ink-soft)] mt-2">Buy a pack once and use the credits across Resumeefy for resumes, interviews, simulations and courses.</p><div className="flex gap-2 mt-5"><Link href="/shop" className="btn btn-primary flex-1 justify-center">Buy credits</Link><button className="btn btn-ghost" onClick={() => setCreditModal(false)}>Later</button></div></div>
          </div>}
          {generated && (
            <div className="mt-4 card p-5">
              <div className="text-xs font-bold text-[var(--blue)] tracking-wider">AI CV CHECKS</div>
              <ul className="mt-2 space-y-1 text-sm">{generated.qualityChecks.map((check) => <li key={check}>✓ {check}</li>)}</ul>
              {generated.experience.length > 0 && <div className="mt-4 text-sm"><b>Generated experience structure</b>{generated.experience.map((e) => <div key={`${e.company}-${e.role}`} className="mt-2"><div className="font-semibold">{e.role} · {e.company}</div><div className="text-xs text-[var(--ink-soft)]">{e.dates}</div></div>)}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-14">Loading…</div>}>
      <ResumeBuilderInner />
    </Suspense>
  );
}
