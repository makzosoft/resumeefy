"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, track, CurrentUser } from "@/lib/client";
import {
  MCQQuestion,
  targetedQuant,
  targetedVerbal,
  targetedBehavioral,
  analyzeStarAnswer,
  roleFamily,
  targetedSjt,
  ROLE_SCENARIOS,
} from "@/lib/questions";
import {
  buildDesktopTasks,
  type BrowserMailContent,
  type DesktopTask,
  type DesignContent,
  type DocumentsContent,
  type SpreadsheetContent,
  type SlidesContent,
  type SupportContent,
  type CodeContent,
} from "@/lib/desktop-sim";
import {
  BrowserIcon,
  DesignIcon,
  DocumentIcon,
  FolderIcon,
  MailIcon,
  SettingsIcon,
  SpreadsheetIcon,
  SlidesIcon,
  SupportIcon,
  CodeIcon,
} from "@/components/AppIcons";

type Step =
  | "gate"
  | "onboarding"
  | "desktop"
  | "behavioral"
  | "verbal"
  | "quant"
  | "sjt"
  | "role"
  | "interview"
  | "results";

const MODULES = [
  { id: "desktop", name: "Desktop Sim", color: "coral" },
  { id: "behavioral", name: "Behavioral", color: "coral" },
  { id: "verbal", name: "Verbal", color: "blue" },
  { id: "quant", name: "Quantitative", color: "amber" },
  { id: "sjt", name: "Situational", color: "violet" },
  { id: "role", name: "Role Sim", color: "mint" },
] as const;

const TIME_LIMITS: Record<string, number> = {
  desktop: 300,
  behavioral: 150,
  verbal: 90,
  quant: 90,
  sjt: 70,
  role: 60,
};

export default function AssessmentPage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [step, setStep] = useState<Step>("gate");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [moduleElapsed, setModuleElapsed] = useState(0);

  const behavioralPrompts = useMemo(() => targetedBehavioral(targetRole, 2), [targetRole]);
  const quantSet = useMemo(() => targetedQuant(targetRole, 3), [targetRole]);
  const verbalSet = useMemo(() => targetedVerbal(targetRole, 3), [targetRole]);
  const sjtSet = useMemo(() => targetedSjt(targetRole, 2), [targetRole]);

  useEffect(() => {
    api<{ user: CurrentUser }>("/api/auth").then((r) => {
      setUser(r.user);
      if (r.user) setStep("onboarding");
    });
  }, []);

  useEffect(() => {
    if (!started || step === "gate" || step === "onboarding" || step === "results") return;
    setModuleElapsed(0);
    const timer = window.setInterval(() => {
      setElapsed((v) => v + 1);
      setModuleElapsed((v) => v + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, step]);

  useEffect(() => {
    if (step === "results" && !saved && Object.keys(scores).length >= MODULES.length) {
      saveResults(scores);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scores, user]);

  async function submitEmailGate(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/leads", {
      method: "POST",
      body: JSON.stringify({ email, source: "assessment_gate" }),
    });
    track("assessment_entry");
    setStep("onboarding");
  }

  function begin() {
    setStarted(true);
    setElapsed(0);
    track("assessment_started", { targetRole, targetCompany, jobDescription });
    setStep("desktop");
  }

  function recordScore(key: string, value: number, next: Step) {
    setScores((s) => ({ ...s, [key]: value }));
    setStep(next);
  }

  async function saveResults(finalScores: Record<string, number>) {
    if (!user) return;
    await api("/api/assessment", {
      method: "POST",
      body: JSON.stringify({ scores: finalScores, targetRole, targetCompany, jobDescription }),
    });
    setSaved(true);
  }

  const activeIndex = MODULES.findIndex((m) => m.id === step);
  const activeLimit = TIME_LIMITS[step] ?? 0;
  const remaining = Math.max(0, activeLimit - moduleElapsed);

  return (
    <div className="assessment-page max-w-6xl mx-auto px-6 py-10">
      {step !== "gate" && step !== "onboarding" && step !== "results" && (
        <nav aria-label="Assessment progress" className="assessment-progress card p-4 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {MODULES.map((m, i) => (
                <div key={m.id} className={`assessment-step ${i <= activeIndex ? "done" : ""}`}>
                  <span>{i <= activeIndex ? "✓" : i + 1}</span>
                  {m.name}
                </div>
              ))}
            </div>
            <div
              className="assessment-timer"
              role="timer"
              aria-live="polite"
              aria-label={`Module time remaining ${formatTime(remaining)}`}
            >
              ⏱ {formatTime(remaining)} <span>module</span>
            </div>
            <div className="assessment-timer" aria-label={`Total elapsed time ${formatTime(elapsed)}`}>
              {formatTime(elapsed)} <span>total</span>
            </div>
          </div>
        </nav>
      )}

      {step === "gate" && (
        <div className="card p-8 max-w-xl mx-auto text-center">
          <h1 className="font-display text-2xl font-semibold">Where should we send your results?</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">Just your email, no spam.</p>
          <form onSubmit={submitEmailGate} className="mt-6 space-y-3">
            <input
              aria-label="Email address"
              className="input"
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn btn-primary w-full justify-center">Continue →</button>
          </form>
        </div>
      )}

      {step === "onboarding" && (
        <div className="assessment-onboarding-grid max-w-5xl mx-auto">
          <div className="card p-8 text-center">
            <VoiceCoach text="Welcome to your Resumeefy assessment. Take your time, read each instruction carefully, and answer as you would in a real hiring process." />
            <h1 className="font-display text-2xl font-semibold">Before we start</h1>
            <p className="text-sm text-[var(--ink-soft)] mt-2">Optional, but it tailors the assessment to you.</p>
            <p className="text-xs text-[var(--ink-soft)] mt-1">6 short modules · about 15 minutes total · your progress is saved as you go</p>
            <div className="mt-6 space-y-3 text-left">
              <input
                aria-label="Target role"
                className="input"
                placeholder="Target role, e.g. Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <input
                aria-label="Target company"
                className="input"
                placeholder="Target company, e.g. Moniepoint"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
              />
              <textarea
                aria-label="Optional job description"
                className="input min-h-[120px]"
                placeholder="Paste the job description here (optional)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-full justify-center mt-6" onClick={begin}>
              Begin assessment →
            </button>
          </div>
          <div className="assessment-coach-card">
            <Image
              src="/illustrations/assessment-coach.svg"
              alt="Resumeefy career coach illustration"
              width={640}
              height={520}
              priority
            />
            <div>
              <span className="section-label">YOUR AI COACH</span>
              <h2>Calm, clear practice that feels closer to the real thing.</h2>
              <p>
                Listen to instructions and interview prompts with a natural voice, then switch the voice
                off whenever you prefer.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "desktop" && (
        <DesktopStep
          elapsed={elapsed}
          targetRole={targetRole}
          jobDescription={jobDescription}
          onDone={(score) => recordScore("desktop", score, "behavioral")}
          onBack={() => setStep("onboarding")}
        />
      )}
      {step === "behavioral" && (
        <BehavioralStep
          prompts={behavioralPrompts}
          onDone={(score) => recordScore("behavioral", score, "verbal")}
          onBack={() => setStep("desktop")}
        />
      )}
      {step === "verbal" && (
        <MCQStep
          title="Verbal Reasoning"
          questions={verbalSet}
          onDone={(score) => recordScore("verbal", score, "quant")}
          onBack={() => setStep("behavioral")}
        />
      )}
      {step === "quant" && (
        <MCQStep
          title="Quantitative Reasoning"
          questions={quantSet}
          onDone={(score) => recordScore("quant", score, "sjt")}
          onBack={() => setStep("verbal")}
        />
      )}
      {step === "sjt" && (
        <MCQStep
          title="Situational Judgment"
          questions={sjtSet}
          onDone={(score) => recordScore("sjt", score, "role")}
          onBack={() => setStep("quant")}
        />
      )}
      {step === "role" && (
        <RoleSimulationStep
          targetRole={targetRole}
          targetCompany={targetCompany}
          jobDescription={jobDescription}
          onDone={(score) => recordScore("role", score, "interview")}
          onBack={() => setStep("sjt")}
        />
      )}
      {step === "interview" && (
        <AdaptiveInterviewStep
          targetRole={targetRole}
          targetCompany={targetCompany}
          jobDescription={jobDescription}
          onDone={(score) => recordScore("interview", score, "results")}
          onBack={() => setStep("role")}
        />
      )}
      {step === "results" && <ResultsStep scores={scores} user={user} saved={saved} />}
    </div>
  );
}

/* =========================
   Voice Coach — browser only
   ========================= */

function VoiceCoach({ text }: { text: string }) {
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem("resumeefy_assessment_voice");
    if (stored === "off") setEnabled(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!enabled || !text.trim()) return;
    if (lastSpokenRef.current === text) return;

    let cancelled = false;
    lastSpokenRef.current = text;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.05;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return null;
      const preferred =
        voices.find((v) => /female/i.test(v.name) && /en(-|_)?/i.test(v.lang)) ||
        voices.find((v) => /samantha|zira|aria|jenny|google uk english female|google us english/i.test(v.name)) ||
        voices.find((v) => /en(-|_)?(gb|us|ng|za|in)/i.test(v.lang)) ||
        voices[0];
      return preferred || null;
    };

    const start = () => {
      if (cancelled) return;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (!cancelled) setSpeaking(false);
      };
      utterance.onerror = () => {
        if (!cancelled) setSpeaking(false);
      };
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        start();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      window.setTimeout(start, 300);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    };
  }, [text, enabled]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem("resumeefy_assessment_voice", next ? "on" : "off");
    if (!next && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      lastSpokenRef.current = "";
    }
  }

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  return (
    <div className="voice-coach" aria-label="Assessment voice controls">
      <button
        type="button"
        className={`voice-toggle ${enabled ? "active" : ""}`}
        onClick={toggle}
        aria-pressed={enabled}
        disabled={!supported}
      >
        <span className="voice-orb" aria-hidden="true">
          {speaking ? "◼" : "◖"}
        </span>
        <span>
          <b>{enabled ? "Voice on" : "Voice off"}</b>
          <small>
            {!supported
              ? "Voice not available in this browser"
              : enabled
              ? "Browser voice · natural pace"
              : "Tap to enable voice"}
          </small>
        </span>
        <span className="voice-switch" aria-hidden="true">
          <i />
        </span>
      </button>
    </div>
  );
}

/* =========================
   Helpers
   ========================= */

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/* =========================
   Behavioral
   ========================= */

function BehavioralStep({
  prompts,
  onDone,
  onBack,
}: {
  prompts: string[];
  onDone: (score: number) => void;
  onBack: () => void;
}) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [total, setTotal] = useState(0);
  const check = text.trim().split(/\s+/).filter(Boolean).length >= 15 ? analyzeStarAnswer(text) : null;

  function next() {
    const score = check?.score ?? 30;
    const newTotal = total + score;
    if (i < prompts.length - 1) {
      setTotal(newTotal);
      setI(i + 1);
      setText("");
    } else {
      onDone(Math.round(newTotal / prompts.length));
    }
  }

  return (
    <div className="card p-8 max-w-3xl mx-auto">
      <VoiceCoach text={prompts[i]} />
      <div className="text-xs font-bold text-[var(--coral)] mb-2">
        BEHAVIORAL · {i + 1} of {prompts.length}
      </div>
      <h2 className="font-display text-xl font-semibold">{prompts[i]}</h2>
      <textarea
        aria-label="STAR answer"
        className="input mt-4 min-h-[170px]"
        placeholder="Situation: ... Task: ... Action: ... Result: ..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-between text-xs text-[var(--ink-soft)] mt-2">
        <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
        <span>Aim for 60+ words</span>
      </div>
      {check && (
        <p
          className={`text-sm mt-3 p-3 rounded-lg ${
            check.tone === "good"
              ? "bg-[var(--mint)]/15 text-[#087a9b]"
              : "bg-[var(--amber)]/15 text-[#8b7100]"
          }`}
        >
          {check.message}
        </p>
      )}
      <div className="mod-nav">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Previous
        </button>
        <button className="btn btn-primary" disabled={!check} onClick={next}>
          {i < prompts.length - 1 ? "Next →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

/* =========================
   MCQ
   ========================= */

function MCQStep({
  title,
  questions,
  onDone,
  onBack,
}: {
  title: string;
  questions: MCQQuestion[];
  onDone: (score: number) => void;
  onBack: () => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const q = questions[i];

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (i < questions.length - 1) {
      setI(i + 1);
      setPicked(null);
    } else {
      onDone(Math.round(((correctCount + (picked === q.correct ? 1 : 0)) / questions.length) * 100));
    }
  }

  return (
    <div className="card p-8 max-w-3xl mx-auto">
      <VoiceCoach text={q?.q || title} />
      <div className="text-xs font-bold text-[var(--blue)] mb-2">
        {title.toUpperCase()} · {i + 1} of {questions.length}
      </div>
      {q.passage && <p className="text-sm bg-[var(--paper-dim)] p-4 rounded-lg mb-3">{q.passage}</p>}
      <h2 className="font-display text-xl font-semibold">{q.q}</h2>
      <div className="mt-5 space-y-2">
        {q.options.map((opt, idx) => {
          const state =
            picked === null ? "" : idx === q.correct ? "correct" : idx === picked ? "wrong" : "";
          return (
            <button
              key={idx}
              aria-label={`Option ${String.fromCharCode(65 + idx)}: ${opt}`}
              onClick={() => pick(idx)}
              className={`assessment-option ${state}`}
            >
              {String.fromCharCode(65 + idx)}. {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="text-sm text-[var(--ink-soft)] mt-4 p-3 rounded-lg bg-[var(--paper-dim)]">
          {picked === q.correct ? "✓ Correct, " : "✗ Not quite, "}
          {q.explain}
        </p>
      )}
      <div className="mod-nav">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Previous
        </button>
        <button className="btn btn-primary" disabled={picked === null} onClick={next}>
          {i < questions.length - 1 ? "Next →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

/* =========================
   Role Simulation
   ========================= */

function RoleSimulationStep({
  targetRole,
  targetCompany,
  jobDescription,
  onDone,
  onBack,
}: {
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  onDone: (score: number) => void;
  onBack: () => void;
}) {
  const family = roleFamily(targetRole);
  const scenario = ROLE_SCENARIOS[family];
  const [picked, setPicked] = useState<number | null>(null);
  const company = targetCompany.trim() || "the company";
  void jobDescription;

  return (
    <div className="card p-8 max-w-3xl mx-auto">
      <VoiceCoach
        text={`${scenario.scenario.replace("{company}", company)} Choose the response that best reflects how you would act at work.`}
      />
      <div className="text-xs font-bold text-[var(--mint)] mb-2">ROLE SIMULATION</div>
      <h2 className="font-display text-xl font-semibold">Role Simulation</h2>
      <p className="text-sm text-[var(--ink-soft)] mt-2">{scenario.scenario.replace("{company}", company)}</p>
      <div className="mt-5 space-y-3">
        {scenario.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={`assessment-option sim-choice ${picked === i ? "picked" : ""}`}
          >
            {choice.text}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="sim-outcome">
          <strong>
            {scenario.choices[picked].quality === "best"
              ? "Strong choice."
              : scenario.choices[picked].quality === "ok"
              ? "Acceptable, but it can be stronger."
              : "Not the best response."}
          </strong>
          <br />
          {scenario.choices[picked].outcome}
        </div>
      )}
      <div className="mod-nav">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Previous
        </button>
        <button
          className="btn btn-primary"
          disabled={picked === null}
          onClick={() =>
            onDone(
              picked === null ? 60 : { best: 95, ok: 70, poor: 40 }[scenario.choices[picked].quality]
            )
          }
        >
          Finish →
        </button>
      </div>
    </div>
  );
}

/* =========================
/* =========================
   Desktop Simulation
   ========================= */

type AppId = "documents" | "spreadsheet" | "browser" | "mail" | "design" | "folder" | "settings" | "slides" | "support" | "code";

const APP_META: Record<AppId, { label: string; Icon: (p: { size?: number }) => JSX.Element }> = {
  documents: { label: "Documents", Icon: DocumentIcon },
  spreadsheet: { label: "Spreadsheet", Icon: SpreadsheetIcon },
  browser: { label: "Browser", Icon: BrowserIcon },
  mail: { label: "Mail", Icon: MailIcon },
  design: { label: "Design Studio", Icon: DesignIcon },
  folder: { label: "Files", Icon: FolderIcon },
  settings: { label: "Settings", Icon: SettingsIcon },
  slides: { label: "Slides", Icon: SlidesIcon },
  support: { label: "Helpdesk", Icon: SupportIcon },
  code: { label: "Code Editor", Icon: CodeIcon },
};

function appsForTask(task: DesktopTask): AppId[] {
  if (task.kind === "basics") return ["documents", "spreadsheet", "folder", "settings"];
  if (task.kind === "browserMail") return ["browser", "mail", "folder", "settings"];
  if (task.kind === "spreadsheet") return ["spreadsheet", "browser", "folder"];
  if (task.kind === "documents") return ["documents", "browser", "folder"];
  if (task.kind === "slides") return ["slides", "folder", "settings"];
  if (task.kind === "support") return ["support", "folder", "settings"];
  if (task.kind === "code") return ["code", "folder", "settings"];
  return ["design", "folder", "settings"];
}

function AppWindow({
  title,
  Icon,
  onMinimize,
  onClose,
  children,
}: {
  title: string;
  Icon: (p: { size?: number }) => JSX.Element;
  onMinimize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="dsim-window dsim-window-enter">
      <div className="dwin-bar">
        <div className="dwin-bar-title">
          <Icon size={16} />
          <b>{title}</b>
        </div>
        <div className="dwin-controls">
          <button className="dwin-btn dwin-btn-min" aria-label={`Minimize ${title}`} onClick={onMinimize}>
            <span />
          </button>
          <button className="dwin-btn dwin-btn-close" aria-label={`Close ${title}`} onClick={onClose}>
            <span />
            <span />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function DesktopStep({
  elapsed,
  targetRole,
  onDone,
  onBack,
}: {
  elapsed: number;
  targetRole: string;
  jobDescription?: string;
  onDone: (score: number) => void;
  onBack: () => void;
}) {
  const tasks = useMemo(() => buildDesktopTasks(targetRole), [targetRole]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskScores, setTaskScores] = useState<number[]>([]);
  const task = tasks[taskIndex];

  const [openApps, setOpenApps] = useState<Partial<Record<AppId, boolean>>>({});
  const [minimized, setMinimized] = useState<Partial<Record<AppId, boolean>>>({});
  const [active, setActive] = useState<AppId | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [mistakes, setMistakes] = useState(0);
  const [decorativeClicks, setDecorativeClicks] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  // basics
  const [openedPrimary, setOpenedPrimary] = useState(false);
  const [minimizedPrimary, setMinimizedPrimary] = useState(false);
  const [restoredPrimary, setRestoredPrimary] = useState(false);
  const [openedSecondary, setOpenedSecondary] = useState(false);
  const [closedSecondary, setClosedSecondary] = useState(false);

  // browser & mail
  const [browserStage, setBrowserStage] = useState<"search" | "results" | "page">("search");
  const [mailStage, setMailStage] = useState<"inbox" | "read" | "compose" | "sent">("inbox");
  const [hasCopied, setHasCopied] = useState(false);
  const [hasPasted, setHasPasted] = useState(false);

  // spreadsheet
  const [formulaEntered, setFormulaEntered] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [sheetSaved, setSheetSaved] = useState(false);

  // documents
  const [docBold, setDocBold] = useState(false);
  const [docTypoFixed, setDocTypoFixed] = useState(false);
  const [docBulleted, setDocBulleted] = useState(false);
  const [docSaved, setDocSaved] = useState(false);

  // design
  const [designTemplate, setDesignTemplate] = useState<string | null>(null);
  const [designColor, setDesignColor] = useState<string | null>(null);
  const [designHeadlineDone, setDesignHeadlineDone] = useState(false);
  const [designExported, setDesignExported] = useState(false);

  // slides
  const [slidesLayout, setSlidesLayout] = useState<string | null>(null);
  const [slidesTitleDone, setSlidesTitleDone] = useState(false);
  const [slidesBulletDone, setSlidesBulletDone] = useState(false);
  const [slidesPresented, setSlidesPresented] = useState(false);

  // support
  const [supportRead, setSupportRead] = useState(false);
  const [supportCategory, setSupportCategory] = useState<string | null>(null);
  const [supportReplied, setSupportReplied] = useState(false);
  const [supportResolved, setSupportResolved] = useState(false);

  // code
  const [codeRead, setCodeRead] = useState(false);
  const [codeFixed, setCodeFixed] = useState(false);
  const [codeRan, setCodeRan] = useState(false);
  const [codeSaved, setCodeSaved] = useState(false);

  useEffect(() => {
    setOpenApps({});
    setMinimized({});
    setActive(null);
    setDone({});
    setMistakes(0);
    setDecorativeClicks(0);
    setAdvancing(false);
    setOpenedPrimary(false);
    setMinimizedPrimary(false);
    setRestoredPrimary(false);
    setOpenedSecondary(false);
    setClosedSecondary(false);
    setBrowserStage("search");
    setMailStage("inbox");
    setHasCopied(false);
    setHasPasted(false);
    setFormulaEntered(false);
    setSorted(false);
    setSheetSaved(false);
    setDocBold(false);
    setDocTypoFixed(false);
    setDocBulleted(false);
    setDocSaved(false);
    setDesignTemplate(null);
    setDesignColor(null);
    setDesignHeadlineDone(false);
    setDesignExported(false);
    setSlidesLayout(null);
    setSlidesTitleDone(false);
    setSlidesBulletDone(false);
    setSlidesPresented(false);
    setSupportRead(false);
    setSupportCategory(null);
    setSupportReplied(false);
    setSupportResolved(false);
    setCodeRead(false);
    setCodeFixed(false);
    setCodeRan(false);
    setCodeSaved(false);
  }, [taskIndex]);

  function markDone(id: string) {
    setDone((d) => (d[id] ? d : { ...d, [id]: true }));
  }

  function openApp(id: AppId) {
    if (id === "folder" || id === "settings") {
      setDecorativeClicks((v) => v + 1);
      return;
    }
    setOpenApps((s) => ({ ...s, [id]: true }));
    setMinimized((s) => ({ ...s, [id]: false }));
    setActive(id);
    if (task.kind === "basics") {
      if (id === task.content.primaryApp) {
        setOpenedPrimary(true);
        markDone("open-a");
      }
      if (id === task.content.secondaryApp) {
        setOpenedSecondary(true);
        markDone("open-b");
      }
    }
    if (task.kind === "spreadsheet" && id === "spreadsheet") markDone("open");
    if (task.kind === "documents" && id === "documents") markDone("open");
    if (task.kind === "design" && id === "design") markDone("open");
    if (task.kind === "slides" && id === "slides") markDone("open");
    if (task.kind === "support" && id === "support") markDone("open");
    if (task.kind === "code" && id === "code") markDone("open");
  }

  function minimizeApp(id: AppId) {
    setMinimized((s) => ({ ...s, [id]: true }));
    setActive((a) => (a === id ? null : a));
    if (task.kind === "basics" && id === task.content.primaryApp && openedPrimary) {
      setMinimizedPrimary(true);
      markDone("minimize-a");
    }
  }

  function restoreApp(id: AppId) {
    setMinimized((s) => ({ ...s, [id]: false }));
    setActive(id);
    if (task.kind === "basics" && id === task.content.primaryApp && minimizedPrimary) {
      setRestoredPrimary(true);
      markDone("restore-a");
    }
  }

  function closeApp(id: AppId) {
    setOpenApps((s) => ({ ...s, [id]: false }));
    setMinimized((s) => ({ ...s, [id]: false }));
    setActive((a) => (a === id ? null : a));
    if (task.kind === "basics" && id === task.content.secondaryApp && openedSecondary) {
      setClosedSecondary(true);
      markDone("close-b");
    }
  }

  const allDone = task.checklist.length > 0 && task.checklist.every((item) => done[item.id]);

  useEffect(() => {
    if (!allDone) return;
    setAdvancing(true);
    const t = window.setTimeout(() => {
      let score = 100 - decorativeClicks * 2 - mistakes * 4;
      if (elapsed < 150) score += 5;
      score = Math.max(60, Math.min(100, score));
      const next = [...taskScores, score];
      setTaskScores(next);
      if (taskIndex < tasks.length - 1) setTaskIndex((v) => v + 1);
      else onDone(Math.round(next.reduce((a, b) => a + b, 0) / next.length));
    }, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const visibleApps = appsForTask(task);
  const activeAppOpen = active && openApps[active] && !minimized[active];

  return (
    <div className="desktop-sim-grid max-w-5xl mx-auto">
      <div className="card p-6 desktop-checklist">
        <VoiceCoach
          text={
            task.kind === "basics"
              ? "This first task checks basic computer operation: opening, minimizing and closing windows."
              : `Task ${taskIndex + 1}. ${task.title}.`
          }
        />
        <div className="text-xs font-bold text-[var(--blue)]">
          DESKTOP SIMULATION · TASK {taskIndex + 1} OF {tasks.length}
        </div>
        <h2 className="font-display text-xl font-semibold mt-2">{task.title}</h2>
        <div className="mt-3 rounded-2xl bg-[var(--blue-dim)] p-4 text-sm font-semibold">
          Open apps yourself by clicking their icon — nothing opens automatically. This moves on the moment every step below is complete.
        </div>
        <div className="mt-5 space-y-3">
          {task.checklist.map((item) => (
            <div key={item.id} className={`cl-item ${done[item.id] ? "done" : ""}`}>
              <span>{done[item.id] ? "✓" : ""}</span>
              {item.label}
            </div>
          ))}
        </div>
        {advancing && (
          <div className="dsim-advancing" role="status">
            All steps complete — {taskIndex < tasks.length - 1 ? "moving to the next task…" : "finishing up…"}
          </div>
        )}
      </div>

      <div className="dsim-screen">
        <div className="dsim-topbar">Resumeefy Desktop Simulation</div>
        <div className="dsim-desktop">
          {visibleApps.map((id) => {
            const { label, Icon } = APP_META[id];
            return (
              <button key={id} title={label} className="dsim-app" onClick={() => openApp(id)}>
                <span className="app-icon-wrap">
                  <Icon size={30} />
                </span>
                {label}
              </button>
            );
          })}
        </div>

        {activeAppOpen && active && (
          <AppWindow
            title={APP_META[active].label}
            Icon={APP_META[active].Icon}
            onMinimize={() => minimizeApp(active)}
            onClose={() => closeApp(active)}
          >
            {task.kind === "basics" && <BasicsWindowContent appId={active} />}
            {task.kind === "browserMail" && active === "browser" && (
              <BrowserWindowContent
                content={task.content}
                stage={browserStage}
                onSearch={() => {
                  setBrowserStage("results");
                  markDone("search");
                }}
                onOpenResult={() => {
                  setBrowserStage("page");
                  markDone("open-result");
                }}
                onCopy={() => {
                  setHasCopied(true);
                  markDone("copy");
                }}
              />
            )}
            {task.kind === "browserMail" && active === "mail" && (
              <MailWindowContent
                content={task.content}
                stage={mailStage}
                hasCopied={hasCopied}
                hasPasted={hasPasted}
                onOpen={() => {
                  setMailStage("read");
                  markDone("open-mail");
                }}
                onReply={() => setMailStage("compose")}
                onPasteAttempt={() => {
                  if (!hasCopied) {
                    setMistakes((v) => v + 1);
                    return;
                  }
                  setHasPasted(true);
                  markDone("paste");
                }}
                onSend={() => {
                  setMailStage("sent");
                  markDone("send");
                }}
              />
            )}
            {task.kind === "spreadsheet" && (
              <SpreadsheetWindowContent
                content={task.content}
                formulaEntered={formulaEntered}
                onFormula={() => {
                  setFormulaEntered(true);
                  markDone("formula");
                }}
                sorted={sorted}
                onSort={() => {
                  setSorted(true);
                  markDone("sort");
                }}
                saved={sheetSaved}
                onSave={() => {
                  setSheetSaved(true);
                  markDone("save");
                }}
              />
            )}
            {task.kind === "documents" && (
              <DocumentsWindowContent
                content={task.content}
                bold={docBold}
                onBold={() => {
                  setDocBold(true);
                  markDone("bold");
                }}
                typoFixed={docTypoFixed}
                onTypoFix={() => {
                  setDocTypoFixed(true);
                  markDone("typo");
                }}
                bulleted={docBulleted}
                onBulletify={() => {
                  setDocBulleted(true);
                  markDone("list");
                }}
                saved={docSaved}
                onSave={() => {
                  setDocSaved(true);
                  markDone("save");
                }}
              />
            )}
            {task.kind === "design" && (
              <DesignWindowContent
                content={task.content}
                template={designTemplate}
                onTemplate={(name: string) => {
                  setDesignTemplate(name);
                  markDone("template");
                }}
                color={designColor}
                onColor={(name: string) => {
                  setDesignColor(name);
                  if (name === task.content.correctColorName) markDone("color");
                  else setMistakes((v) => v + 1);
                }}
                headlineDone={designHeadlineDone}
                onHeadline={() => {
                  setDesignHeadlineDone(true);
                  markDone("headline");
                }}
                exported={designExported}
                onExport={() => {
                  setDesignExported(true);
                  markDone("export");
                }}
              />
            )}
            {task.kind === "slides" && (
              <SlidesWindowContent
                content={task.content}
                layout={slidesLayout}
                onLayout={(name: string) => {
                  setSlidesLayout(name);
                  if (name === task.content.correctLayoutName) markDone("layout");
                  else setMistakes((v) => v + 1);
                }}
                titleDone={slidesTitleDone}
                onTitle={() => {
                  setSlidesTitleDone(true);
                  markDone("title");
                }}
                bulletDone={slidesBulletDone}
                onBullet={() => {
                  setSlidesBulletDone(true);
                  markDone("bullet");
                }}
                presented={slidesPresented}
                onPresent={() => {
                  setSlidesPresented(true);
                  markDone("present");
                }}
              />
            )}
            {task.kind === "support" && (
              <SupportWindowContent
                content={task.content}
                read={supportRead}
                onRead={() => {
                  setSupportRead(true);
                  markDone("read");
                }}
                category={supportCategory}
                onCategory={(name: string) => {
                  setSupportCategory(name);
                  if (name === task.content.correctCategory) markDone("category");
                  else setMistakes((v) => v + 1);
                }}
                replied={supportReplied}
                onReply={(isCorrect: boolean) => {
                  setSupportReplied(true);
                  if (isCorrect) markDone("reply");
                  else setMistakes((v) => v + 1);
                }}
                resolved={supportResolved}
                onResolve={() => {
                  setSupportResolved(true);
                  markDone("resolve");
                }}
              />
            )}
            {task.kind === "code" && (
              <CodeWindowContent
                content={task.content}
                read={codeRead}
                onRead={() => {
                  setCodeRead(true);
                  markDone("read");
                }}
                fixed={codeFixed}
                onFix={() => {
                  setCodeFixed(true);
                  markDone("fix");
                }}
                ran={codeRan}
                onRun={() => {
                  setCodeRan(true);
                  markDone("run");
                }}
                saved={codeSaved}
                onSave={() => {
                  setCodeSaved(true);
                  markDone("save");
                }}
              />
            )}
          </AppWindow>
        )}

        <div className="dsim-taskbar">
          <span className="dsim-taskbar-start">Start</span>
          <div className="dsim-taskbar-chips">
            {visibleApps
              .filter((id) => openApps[id] && minimized[id])
              .map((id) => {
                const { label, Icon } = APP_META[id];
                return (
                  <button key={id} className="dsim-chip" onClick={() => restoreApp(id)}>
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
          </div>
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="mod-nav">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Previous
        </button>
      </div>
    </div>
  );
}

function BasicsWindowContent({ appId }: { appId: AppId }) {
  if (appId === "documents") {
    return (
      <div className="dwin-body doc-body">
        <h4>Welcome note (untitled)</h4>
        <p>This is a blank document window. For this task, use the window's own minimize and close controls — nothing needs typing here.</p>
      </div>
    );
  }
  return (
    <div className="dwin-body">
      <table className="sheet">
        <tbody>
          <tr>
            <th>A</th>
            <th>B</th>
            <th>C</th>
          </tr>
          <tr>
            <td />
            <td />
            <td />
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-[var(--ink-soft)] mt-3">An empty spreadsheet. Use the window's own controls to complete this task.</p>
    </div>
  );
}

function BrowserWindowContent({
  content,
  stage,
  onSearch,
  onOpenResult,
  onCopy,
}: {
  content: BrowserMailContent;
  stage: "search" | "results" | "page";
  onSearch: () => void;
  onOpenResult: () => void;
  onCopy: () => void;
}) {
  const [query, setQuery] = useState("");
  if (stage === "search") {
    return (
      <div className="dwin-body">
        <div className="browser-bar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search the web"
            aria-label="Search"
          />
          <button className="btn-sm" onClick={onSearch}>
            Search
          </button>
        </div>
        <p className="text-xs text-[var(--ink-soft)] mt-3">Type your search and press Enter, or click Search.</p>
      </div>
    );
  }
  if (stage === "results") {
    return (
      <div className="dwin-body">
        <div className="browser-bar">
          <input defaultValue={content.searchQuery} readOnly aria-label="Search" />
        </div>
        <button className="search-result" onClick={onOpenResult}>
          <b>{content.resultUrl}</b>
          <strong>{content.resultTitle}</strong>
        </button>
        {content.otherResults.map((r) => (
          <div className="search-result dim" key={r.url}>
            <b>{r.url}</b>
            <strong>{r.title}</strong>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="dwin-body">
      <h3>{content.pageTitle}</h3>
      <p>{content.pageBody}</p>
      <p className="copy-hint mt-3">Select the highlighted text, then copy it — Ctrl/Cmd+C or right-click → Copy. There's no Copy button.</p>
      <span className="copyable-chip" tabIndex={0} onCopy={onCopy}>
        {content.copyValue}
      </span>
    </div>
  );
}

function MailWindowContent({
  content,
  stage,
  hasCopied,
  hasPasted,
  onOpen,
  onReply,
  onPasteAttempt,
  onSend,
}: {
  content: BrowserMailContent;
  stage: "inbox" | "read" | "compose" | "sent";
  hasCopied: boolean;
  hasPasted: boolean;
  onOpen: () => void;
  onReply: () => void;
  onPasteAttempt: () => void;
  onSend: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  if (stage === "inbox") {
    return (
      <div className="dwin-body">
        <button className="mail-row" onClick={onOpen}>
          <b>{content.from}</b>
          <span className="mail-subject">{content.subject}</span>
          <p className="mail-preview">{content.preview}</p>
        </button>
      </div>
    );
  }
  if (stage === "read") {
    return (
      <div className="dwin-body">
        <p>
          <b>From:</b> {content.from} &lt;{content.fromEmail}&gt;
        </p>
        <p>
          <b>Subject:</b> {content.subject}
        </p>
        <p className="mt-3">{content.fullMessage}</p>
        <button className="btn-sm mt-4" onClick={onReply}>
          Reply
        </button>
      </div>
    );
  }
  if (stage === "compose") {
    return (
      <div className="dwin-body">
        <p className="text-xs text-[var(--ink-soft)]">To: {content.fromEmail}</p>
        <p className="copy-hint mt-2">Click into the box, then paste — Ctrl/Cmd+V or right-click → Paste. There's no Paste button.</p>
        <textarea
          className="mt-2"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text) onPasteAttempt();
          }}
          placeholder={`${content.replyOpener} …`}
        />
        <button className="btn-sm mt-3" disabled={!hasPasted || !hasCopied} onClick={onSend}>
          Send
        </button>
      </div>
    );
  }
  return (
    <div className="dwin-body">
      <p className="text-sm text-[var(--mint)] font-semibold">Reply sent.</p>
    </div>
  );
}

function SpreadsheetWindowContent({
  content,
  formulaEntered,
  onFormula,
  sorted,
  onSort,
  saved,
  onSave,
}: {
  content: SpreadsheetContent;
  formulaEntered: boolean;
  onFormula: () => void;
  sorted: boolean;
  onSort: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const [formulaInput, setFormulaInput] = useState("");
  const [rows, setRows] = useState(content.rows);
  const total = content.rows.reduce((a, r) => a + r.value, 0);
  return (
    <div className="dwin-body">
      <h4>{content.title}</h4>
      <table className="sheet mt-2">
        <thead>
          <tr>
            <th>{content.rowLabel}</th>
            <th
              className="sheet-sortable"
              onClick={() => {
                setRows((r) => [...r].sort((a, b) => b.value - a.value));
                onSort();
              }}
            >
              {content.sortColumn} {sorted ? "✓" : "▾ click to sort"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.value.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="sheet-total-row">
            <td>
              <b>{content.sumLabel}</b>
            </td>
            <td>
              <input
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                onBlur={() => {
                  if (/^=?\s*sum/i.test(formulaInput.trim())) onFormula();
                }}
                placeholder="=SUM(...)"
                aria-label="Formula"
              />
            </td>
          </tr>
        </tbody>
      </table>
      {formulaEntered && (
        <p className="text-xs text-[var(--mint)] mt-2">Formula recognized — total is {total.toLocaleString()}.</p>
      )}
      <button className="btn-sm mt-4" disabled={!formulaEntered || !sorted} onClick={onSave}>
        Save
      </button>
      {saved && <p className="text-sm text-[var(--mint)] mt-2">Spreadsheet saved.</p>}
    </div>
  );
}

function DocumentsWindowContent({
  content,
  bold,
  onBold,
  typoFixed,
  onTypoFix,
  bulleted,
  onBulletify,
  saved,
  onSave,
}: {
  content: DocumentsContent;
  bold: boolean;
  onBold: () => void;
  typoFixed: boolean;
  onTypoFix: () => void;
  bulleted: boolean;
  onBulletify: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const parts = content.bodyWithTypo.split(content.typoWord);
  return (
    <div className="dwin-body doc-body">
      <h4 className={`doc-heading ${bold ? "is-bold" : ""}`} onClick={onBold} role="button" tabIndex={0}>
        {content.heading}
        {!bold && <span className="doc-hint"> (click to bold)</span>}
      </h4>
      <p>
        {parts[0]}
        <span className={typoFixed ? "doc-typo-fixed" : "doc-typo"} onClick={onTypoFix} role="button" tabIndex={0}>
          {typoFixed ? content.correctedWord : content.typoWord}
        </span>
        {parts[1]}
      </p>
      <p className="mt-3">{content.listIntro}</p>
      {!bulleted ? (
        <div onClick={onBulletify} className="doc-plain-list" role="button" tabIndex={0}>
          {content.listItems.map((item) => (
            <p key={item}>{item}</p>
          ))}
          <span className="doc-hint">(click to turn into a bulleted list)</span>
        </div>
      ) : (
        <ul>
          {content.listItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <button className="btn-sm mt-4" disabled={!bold || !typoFixed || !bulleted} onClick={onSave}>
        Save
      </button>
      {saved && <p className="text-sm text-[var(--mint)] mt-2">Document saved.</p>}
    </div>
  );
}

function DesignWindowContent({
  content,
  template,
  onTemplate,
  color,
  onColor,
  headlineDone,
  onHeadline,
  exported,
  onExport,
}: {
  content: DesignContent;
  template: string | null;
  onTemplate: (name: string) => void;
  color: string | null;
  onColor: (name: string) => void;
  headlineDone: boolean;
  onHeadline: () => void;
  exported: boolean;
  onExport: () => void;
}) {
  const [headline, setHeadline] = useState("");
  const activeColor = content.colorOptions.find((c) => c.name === color)?.hex;
  return (
    <div className="dwin-body design-body">
      <p className="text-xs text-[var(--ink-soft)]">{content.brief}</p>
      {!template ? (
        <button className="design-template-card mt-3" onClick={() => onTemplate(content.templateName)}>
          <span className="dt-preview" />
          {content.templateName}
        </button>
      ) : (
        <>
          <div className="design-canvas mt-3" style={{ background: activeColor || "#cbd5e1" }}>
            <span className="design-canvas-text">{headline || "Your headline here"}</span>
          </div>
          <div className="design-colors mt-3">
            {content.colorOptions.map((c) => (
              <button
                key={c.name}
                className={`design-swatch ${color === c.name ? "active" : ""}`}
                style={{ background: c.hex }}
                title={c.name}
                onClick={() => onColor(c.name)}
                aria-label={c.name}
              />
            ))}
          </div>
          <input
            className="input mt-3"
            placeholder={`Type: ${content.headline}`}
            value={headline}
            onChange={(e) => {
              setHeadline(e.target.value);
              if (e.target.value.trim() === content.headline) onHeadline();
            }}
          />
          <button className="btn-sm mt-3" disabled={!color || !headlineDone} onClick={onExport}>
            Export design
          </button>
          {exported && <p className="text-sm text-[var(--mint)] mt-2">Design exported.</p>}
        </>
      )}
    </div>
  );
}

function SlidesWindowContent({
  content,
  layout,
  onLayout,
  titleDone,
  onTitle,
  bulletDone,
  onBullet,
  presented,
  onPresent,
}: {
  content: SlidesContent;
  layout: string | null;
  onLayout: (name: string) => void;
  titleDone: boolean;
  onTitle: () => void;
  bulletDone: boolean;
  onBullet: () => void;
  presented: boolean;
  onPresent: () => void;
}) {
  const [titleText, setTitleText] = useState("");
  return (
    <div className="dwin-body slides-body">
      <p className="text-xs text-[var(--ink-soft)]">{content.brief}</p>
      {!layout ? (
        <div className="slides-layout-grid mt-3">
          {content.layoutOptions.map((opt) => (
            <button key={opt.name} className="slides-layout-card" onClick={() => onLayout(opt.name)}>
              <span className="slides-layout-preview" data-layout={opt.name === content.correctLayoutName ? "match" : "other"} />
              <b>{opt.name}</b>
              <small>{opt.description}</small>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="slide-canvas mt-3">
            <input
              className="slide-title-input"
              placeholder={`Type: ${content.title}`}
              value={titleText}
              onChange={(e) => {
                setTitleText(e.target.value);
                if (e.target.value.trim() === content.title) onTitle();
              }}
            />
            {bulletDone && <p className="slide-bullet">• {content.bulletSuggestion}</p>}
          </div>
          {!bulletDone && (
            <button className="btn-sm mt-3" disabled={!titleDone} onClick={onBullet}>
              {content.bulletPrompt}
            </button>
          )}
          <button className="btn-sm mt-3" disabled={!titleDone || !bulletDone} onClick={onPresent}>
            Present
          </button>
          {presented && <p className="text-sm text-[var(--mint)] mt-2">Slide presented.</p>}
        </>
      )}
    </div>
  );
}

function SupportWindowContent({
  content,
  read,
  onRead,
  category,
  onCategory,
  replied,
  onReply,
  resolved,
  onResolve,
}: {
  content: SupportContent;
  read: boolean;
  onRead: () => void;
  category: string | null;
  onCategory: (name: string) => void;
  replied: boolean;
  onReply: (isCorrect: boolean) => void;
  resolved: boolean;
  onResolve: () => void;
}) {
  return (
    <div className="dwin-body support-body">
      {!read ? (
        <button className="search-result" onClick={onRead}>
          <b>NEW TICKET · {content.customerName.toUpperCase()}</b>
          <strong>{content.ticketSubject}</strong>
        </button>
      ) : (
        <>
          <div className="support-ticket">
            <div className="support-ticket-from">{content.customerName}</div>
            <p>{content.ticketBody}</p>
          </div>
          <p className="copy-hint mt-3">Tag this ticket:</p>
          <div className="support-tag-row">
            {content.categories.map((c) => (
              <button key={c} className={`support-tag ${category === c ? "active" : ""}`} onClick={() => onCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <p className="copy-hint mt-3">Choose the response that matches the issue:</p>
          <div className="grid gap-2 mt-1">
            {content.responseOptions.map((opt) => (
              <button key={opt.label} className="quiz-option" onClick={() => onReply(opt.isCorrect)} disabled={replied}>
                {opt.body}
              </button>
            ))}
          </div>
          <button className="btn-sm mt-3" disabled={!category || !replied} onClick={onResolve}>
            Mark resolved
          </button>
          {resolved && <p className="text-sm text-[var(--mint)] mt-2">Ticket resolved.</p>}
        </>
      )}
    </div>
  );
}

function CodeWindowContent({
  content,
  read,
  onRead,
  fixed,
  onFix,
  ran,
  onRun,
  saved,
  onSave,
}: {
  content: CodeContent;
  read: boolean;
  onRead: () => void;
  fixed: boolean;
  onFix: () => void;
  ran: boolean;
  onRun: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="dwin-body code-body">
      <div className="code-filebar">{content.fileName}</div>
      {!read ? (
        <button className="btn-sm mt-3" onClick={onRead}>
          View failing test
        </button>
      ) : (
        <>
          <p className="text-xs text-[var(--ink-soft)] mt-2">{content.description}</p>
          <pre className="code-block mt-3">
            {content.lines.map((line, i) =>
              i === content.buggyLineIndex ? (
                <div
                  key={i}
                  className={fixed ? "code-line code-line-fixed" : "code-line code-line-buggy"}
                  onClick={() => !fixed && onFix()}
                >
                  {fixed ? content.fixedText : line}
                </div>
              ) : (
                <div key={i} className="code-line">
                  {line}
                </div>
              )
            )}
          </pre>
          <button className="btn-sm mt-3" disabled={!fixed} onClick={onRun}>
            Run tests
          </button>
          {ran && <p className="code-test-pass mt-2">✓ {content.testName}</p>}
          {ran && (
            <button className="btn-sm mt-3" onClick={onSave}>
              Save file
            </button>
          )}
          {saved && <p className="text-sm text-[var(--mint)] mt-2">File saved.</p>}
        </>
      )}
    </div>
  );
}

/* =========================
   Adaptive Interview
   ========================= */

function AdaptiveInterviewStep({
  targetRole,
  targetCompany,
  jobDescription,
  onDone,
  onBack,
}: {
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  onDone: (score: number) => void;
  onBack: () => void;
}) {
  type Question = {
    id: string;
    type: string;
    question: string;
    whyItMatters: string;
    followUp: string;
    strongAnswerSignals: string[];
  };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    betterAnswer: string;
    followUp: string;
  } | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await api<{ questions: Question[] }>("/api/ai?action=interview_questions", {
          method: "POST",
          body: JSON.stringify({
            action: "interview_questions",
            targetRole,
            targetCompany,
            jobDescription,
          }),
        });
        if (active) setQuestions(result.questions);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not generate interview questions.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [targetRole, targetCompany, jobDescription]);

  async function evaluate() {
    if (!answer.trim() || !questions[i]) return;
    setLoading(true);
    try {
      const result = await api<{
        score: number;
        strengths: string[];
        improvements: string[];
        betterAnswer: string;
        followUp: string;
      }>("/api/ai?action=interview_feedback", {
        method: "POST",
        body: JSON.stringify({
          action: "interview_feedback",
          question: questions[i].question,
          answer,
          targetRole,
          targetCompany,
          jobDescription,
        }),
      });
      setFeedback(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not evaluate your answer.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!feedback) return;
    const nextScores = [...scores, feedback.score];
    if (i < questions.length - 1) {
      setScores(nextScores);
      setI(i + 1);
      setAnswer("");
      setFeedback(null);
      setError("");
    } else {
      onDone(Math.round(nextScores.reduce((a, b) => a + b, 0) / nextScores.length));
    }
  }

  if (loading && !questions.length)
    return (
      <div className="card p-8 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-xl font-semibold">Building your interview...</h2>
        <p className="text-sm text-[var(--ink-soft)] mt-2">Questions are being tailored to {targetRole}.</p>
      </div>
    );

  if (error && !questions.length)
    return (
      <div className="card p-8 max-w-3xl mx-auto">
        <h2 className="font-display text-xl font-semibold">Interview coach unavailable</h2>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <button className="btn btn-ghost mt-5" onClick={onBack}>
          ← Back
        </button>
      </div>
    );

  const q = questions[i];

  return (
    <div className="card p-8 max-w-3xl mx-auto">
      <div className="assessment-interview-head">
        <VoiceCoach text={feedback ? `Feedback: ${feedback.followUp || q.followUp}` : q.question} />
        <div className="ai-coach-mini">
          <Image src="/illustrations/assessment-coach.svg" alt="" width={150} height={122} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold text-[var(--violet)]">
          AI INTERVIEW COACH · {i + 1} OF {questions.length}
        </div>
        <span className="text-xs rounded-full px-3 py-1 bg-[var(--paper-dim)]">{q.type}</span>
      </div>
      <h2 className="font-display text-xl font-semibold mt-3">{q.question}</h2>
      <p className="text-xs text-[var(--ink-soft)] mt-2">Why it matters: {q.whyItMatters}</p>

      {!feedback ? (
        <>
          <textarea
            className="input mt-5 min-h-[180px]"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer as if you are in the real interview. Use a specific example where possible."
          />
          <div className="text-xs text-[var(--ink-soft)] mt-2">
            Tip: use Situation, Task, Action and Result when the question asks for an example.
          </div>
          <div className="mod-nav">
            <button className="btn btn-ghost" onClick={onBack}>
              ← Previous
            </button>
            <button
              className="btn btn-primary"
              disabled={answer.trim().length < 20 || loading}
              onClick={() => void evaluate()}
            >
              {loading ? "Evaluating…" : "Get instant feedback →"}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-[var(--paper-dim)] p-4">
            <div className="text-xs font-bold">ANSWER SCORE</div>
            <div className="font-display text-3xl font-semibold mt-1">{feedback.score}/100</div>
          </div>
          <div>
            <div className="text-sm font-bold">What worked</div>
            <ul className="text-sm mt-2 space-y-1">
              {feedback.strengths.map((x) => (
                <li key={x}>✓ {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold">Improve next time</div>
            <ul className="text-sm mt-2 space-y-1">
              {feedback.improvements.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-4">
            <div className="text-xs font-bold">STRONGER VERSION</div>
            <p className="text-sm mt-2">{feedback.betterAnswer}</p>
          </div>
          <div className="rounded-xl bg-[var(--blue-dim)] p-4">
            <div className="text-xs font-bold">FOLLOW UP</div>
            <p className="text-sm mt-1">{feedback.followUp || q.followUp}</p>
          </div>
          <button className="btn btn-primary w-full justify-center" onClick={next}>
            {i < questions.length - 1 ? "Next question →" : "Finish interview →"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
    </div>
  );
}

/* =========================
   Results
   ========================= */

function ResultsStep({
  scores,
  user,
  saved,
}: {
  scores: Record<string, number>;
  user: CurrentUser;
  saved: boolean;
}) {
  const values = Object.values(scores);
  const overall = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const certId = `RSMFY-${Date.now().toString(36).toUpperCase()}`;
  const strongest = MODULES.reduce(
    (a, b) => ((scores[b.id] ?? 0) > (scores[a.id] ?? 0) ? b : a),
    MODULES[0]
  );
  const weakest = MODULES.reduce(
    (a, b) => ((scores[b.id] ?? 0) < (scores[a.id] ?? 0) ? b : a),
    MODULES[0]
  );
  const displayName = user?.name || "Resumeefy Candidate";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-8">
        <div
          className="w-36 h-36 rounded-full mx-auto flex items-center justify-center text-4xl font-display font-semibold"
          style={{ background: `conic-gradient(var(--mint) ${overall}%, var(--paper-dim) 0)` }}
        >
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">{overall}</div>
        </div>
        <h1 className="font-display text-2xl font-semibold mt-6">Your Readiness Score</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-lg mx-auto">
          Strongest in <b>{strongest.name}</b>. Focus your next session on <b>{weakest.name}</b> for the
          biggest jump.
        </p>
      </div>

      <div className="card p-6">
        <RadarChart scores={scores} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
          {MODULES.map((m) => (
            <div key={m.id} className="bg-[var(--paper-dim)] rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-[var(--ink-soft)]">{m.name}</div>
              <div className="font-display text-xl font-semibold">{scores[m.id] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>

      {!user ? (
        <div className="mt-6 bg-[var(--blue-dim)] rounded-xl p-5 text-left">
          <p className="text-sm font-bold">Create a free account to save this result</p>
          <Link href="/signup" className="btn btn-primary mt-4">
            Create account →
          </Link>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-soft)] text-center mt-5">
          {saved ? "Saved to your account." : "Saving…"}
        </p>
      )}

      <CertificateCard
        scores={scores}
        overall={overall}
        certId={certId}
        defaultName={displayName}
        user={user}
      />
      <Link href="/resume-builder" className="btn btn-ghost mt-4 w-full justify-center">
        Now build your resume →
      </Link>
    </div>
  );
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const cx = 160,
    cy = 150,
    r = 105,
    n = MODULES.length;
  const point = (i: number, value: number) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return [cx + (value / 100) * r * Math.cos(a), cy + (value / 100) * r * Math.sin(a)];
  };
  const polygon = (factor: number) =>
    MODULES.map((_, i) => point(i, factor * 100).join(",")).join(" ");
  const data = MODULES.map((m, i) => point(i, scores[m.id] ?? 0).join(",")).join(" ");

  return (
    <svg
      viewBox="0 0 320 300"
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Readiness score radar chart"
    >
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={polygon(f)} fill="none" stroke="var(--line)" strokeWidth="1" />
      ))}
      {MODULES.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />;
      })}
      <polygon points={data} fill="rgba(23,195,178,.22)" stroke="var(--mint)" strokeWidth="2.5" />
      {MODULES.map((m, i) => {
        const [x, y] = point(i, scores[m.id] ?? 0);
        return <circle key={m.id} cx={x} cy={y} r="4" fill="var(--mint)" />;
      })}
      {MODULES.map((m, i) => {
        const [x, y] = point(i, 118);
        return (
          <text
            key={m.id}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="var(--ink-soft)"
          >
            {m.name}
          </text>
        );
      })}
    </svg>
  );
}

function CertificateCard({
  scores,
  overall,
  certId,
  defaultName,
  user,
}: {
  scores: Record<string, number>;
  overall: number;
  certId: string;
  defaultName: string;
  user: CurrentUser;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");

  useEffect(() => {
    drawCertificate(canvasRef.current, name, scores, overall, certId);
  }, [name, scores, overall, certId]);

  function download() {
    if (!user) {
      setMessage("Create an account first to download your certificate.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `resumeefy-certificate-${certId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setMessage("Certificate download started.");
  }
  function shareLinkedIn() {
    const caption = `I just completed my Resumeefy job-readiness assessment and scored ${overall}/100. Practice the interview before it happens: https://resumeefy.site`;
    navigator.clipboard?.writeText(caption).catch(() => {});
    window.open(
      "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent("https://resumeefy.site"),
      "_blank",
      "noopener,noreferrer"
    );
    setMessage("Caption copied. Paste it into your LinkedIn post.");
  }
  function openFull() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.open();
    if (w) {
      w.document.write(
        `<title>Resumeefy Certificate</title><img src="${canvas.toDataURL("image/png")}" style="width:100%">`
      );
    }
  }

  return (
    <div className="card p-6 mt-7 text-center">
      <div className="text-xs font-bold text-[var(--ink-soft)] mb-4">🎓 CERTIFICATE OF READINESS</div>
      <canvas
        ref={canvasRef}
        className="certificate-canvas"
        aria-label="Resumeefy Certificate of Readiness"
      />
      <input
        aria-label="Certificate name"
        className="input mt-4 max-w-sm text-center"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type your name to personalize it"
      />
      <div className="flex gap-2 justify-center flex-wrap mt-4">
        <button className="btn btn-primary" onClick={download}>
          ⬇ Download Certificate
        </button>
        <button className="btn btn-ghost" onClick={shareLinkedIn}>
          Share on LinkedIn
        </button>
        <button className="btn btn-ghost" onClick={openFull}>
          Open full size
        </button>
      </div>
      {message && (
        <p className="text-xs text-[var(--ink-soft)] mt-3" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function drawCertificate(
  canvas: HTMLCanvasElement | null,
  name: string,
  scores: Record<string, number>,
  overall: number,
  certId: string
) {
  if (!canvas) return;
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, "#0A1E3D");
  grad.addColorStop(1, "#000B1D");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);
  [
    [110, 80, 140, "#C99A3E"],
    [1120, 90, 110, "#00B4FC"],
    [1080, 730, 160, "#0825A8"],
    [70, 720, 100, "#FFD700"],
  ].forEach(([x, y, r, c]) => {
    ctx.beginPath();
    ctx.arc(x as number, y as number, r as number, 0, Math.PI * 2);
    ctx.fillStyle = (c as string) + "22";
    ctx.fill();
  });
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, 1132, 732);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd700";
  ctx.font = "700 22px Georgia";
  ctx.fillText("RESUMEEFY", 600, 95);
  ctx.fillStyle = "#fff";
  ctx.font = "700 38px Georgia";
  ctx.fillText("Certificate of Readiness", 600, 170);
  ctx.font = "400 17px Georgia";
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.fillText("This certifies that", 600, 205);
  ctx.font = "700 40px Georgia";
  ctx.fillStyle = "#fff";
  ctx.fillText(name || "Resumeefy Candidate", 600, 254);
  ctx.font = "400 16px Georgia";
  ctx.fillStyle = "rgba(255,255,255,.68)";
  ctx.fillText("has completed the Resumeefy job-readiness assessment", 600, 282);
  const cx = 330,
    cy = 470,
    R = 130,
    n = MODULES.length;
  const pt = (i: number, val: number): [number, number] => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return [cx + (val / 100) * R * Math.cos(a), cy + (val / 100) * R * Math.sin(a)];
  };
  [0.33, 0.66, 1].forEach((f) => {
    ctx.beginPath();
    MODULES.forEach((_, i) => {
      const [x, y] = pt(i, f * 100);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
  MODULES.forEach((_, i) => {
    const [x, y] = pt(i, 100);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.stroke();
  });
  ctx.beginPath();
  MODULES.forEach((m, i) => {
    const [x, y] = pt(i, scores[m.id] ?? 0);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(23,195,178,.28)";
  ctx.fill();
  ctx.strokeStyle = "#00B4FC";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  MODULES.forEach((m, i) => {
    const [x, y] = pt(i, scores[m.id] ?? 0);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  });
  const rx = 890,
    ry = 460,
    rr = 90;
  ctx.beginPath();
  ctx.arc(rx, ry, rr, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.lineWidth = 15;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rx, ry, rr, -Math.PI / 2, -Math.PI / 2 + (overall / 100) * Math.PI * 2);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.font = "700 48px Georgia";
  ctx.fillStyle = "#fff";
  ctx.fillText(String(overall), rx, ry + 16);
  ctx.font = "400 13px Georgia";
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.fillText("READINESS SCORE", rx, ry + 50);
  ctx.textAlign = "left";
  MODULES.forEach((m, i) => {
    const mx = 740,
      my = 590 + i * 30;
    ctx.fillStyle = hexColor(m.color);
    ctx.fillRect(mx, my - 11, 12, 12);
    ctx.font = "400 15px Georgia";
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(m.name + ":", mx + 20, my);
    ctx.font = "700 15px Georgia";
    ctx.fillStyle = "#fff";
    ctx.fillText(String(scores[m.id] ?? 0), mx + 150, my);
  });
  ctx.textAlign = "center";
  ctx.font = "400 13px Georgia";
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fillText(
    `ID ${certId} · Issued ${new Date().toLocaleDateString()} · resumeefy.com`,
    600,
    758
  );
}

function hexColor(name: string) {
  return (
    ({
      blue: "#0A2FCC",
      violet: "#0825A8",
      coral: "#C99A3E",
      amber: "#FFD700",
      mint: "#00B4FC",
    } as Record<string, string>)[name] || "#0A2FCC"
  );
}