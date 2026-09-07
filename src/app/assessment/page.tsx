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
  SCENARIOS,
} from "@/lib/questions";

type Step = "gate" | "onboarding" | "desktop" | "behavioral" | "verbal" | "quant" | "sjt" | "role" | "interview" | "results";
const MODULES = [
  { id: "desktop", name: "Desktop Sim", color: "coral" },
  { id: "behavioral", name: "Behavioral", color: "coral" },
  { id: "verbal", name: "Verbal", color: "blue" },
  { id: "quant", name: "Quantitative", color: "amber" },
  { id: "sjt", name: "Situational", color: "violet" },
  { id: "role", name: "Role Sim", color: "mint" },
] as const;
const TIME_LIMITS: Record<string, number> = { desktop: 300, behavioral: 150, verbal: 90, quant: 90, sjt: 70, role: 60 };

export default function AssessmentPage() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [step, setStep] = useState<Step>("gate");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [creditModal, setCreditModal] = useState(false);
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
    if (step === "results" && !saved && Object.keys(scores).length >= MODULES.length) saveResults(scores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scores, user]);

  async function submitEmailGate(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/leads", { method: "POST", body: JSON.stringify({ email, source: "assessment_gate" }) });
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
    await api("/api/assessment", { method: "POST", body: JSON.stringify({ scores: finalScores, targetRole, targetCompany, jobDescription }) });
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
                  <span>{i <= activeIndex ? "✓" : i + 1}</span>{m.name}
                </div>
              ))}
            </div>
            <div className="assessment-timer" role="timer" aria-live="polite" aria-label={`Module time remaining ${formatTime(remaining)}`}>⏱ {formatTime(remaining)} <span>module</span></div>
            <div className="assessment-timer" aria-label={`Total elapsed time ${formatTime(elapsed)}`}>{formatTime(elapsed)} <span>total</span></div>
          </div>
        </nav>
      )}

      {step === "gate" && (
        <div className="card p-8 max-w-xl mx-auto text-center">
          <h1 className="font-display text-2xl font-semibold">Where should we send your results?</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">Just your email, no spam.</p>
          <form onSubmit={submitEmailGate} className="mt-6 space-y-3">
            <input aria-label="Email address" className="input" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <div className="mt-6 space-y-3 text-left">
            <input aria-label="Target role" className="input" placeholder="Target role, e.g. Product Manager" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            <input aria-label="Target company" className="input" placeholder="Target company, e.g. Moniepoint" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} />
            <textarea aria-label="Optional job description" className="input min-h-[120px]" placeholder="Paste the job description here (optional)" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
          </div>
          <button className="btn btn-primary w-full justify-center mt-6" onClick={begin}>Begin assessment →</button>
          </div>
          <div className="assessment-coach-card">
            <Image src="/illustrations/assessment-coach.svg" alt="Resumeefy career coach illustration" width={640} height={520} priority />
            <div><span className="section-label">YOUR AI COACH</span><h2>Calm, clear practice that feels closer to the real thing.</h2><p>Listen to instructions and interview prompts with a natural voice, then switch the voice off whenever you prefer.</p></div>
          </div>
        </div>
      )}

      {step === "desktop" && <DesktopStep elapsed={elapsed} targetRole={targetRole} jobDescription={jobDescription} onDone={(score) => recordScore("desktop", score, "behavioral")} onBack={() => setStep("onboarding")} />}
      {step === "behavioral" && <BehavioralStep prompts={behavioralPrompts} onDone={(score) => recordScore("behavioral", score, "verbal")} onBack={() => setStep("desktop")} />}
      {step === "verbal" && <MCQStep title="Verbal Reasoning" questions={verbalSet} onDone={(score) => recordScore("verbal", score, "quant")} onBack={() => setStep("behavioral")} />}
      {step === "quant" && <MCQStep title="Quantitative Reasoning" questions={quantSet} onDone={(score) => recordScore("quant", score, "sjt")} onBack={() => setStep("verbal")} />}
      {step === "sjt" && <MCQStep title="Situational Judgment" questions={sjtSet} onDone={(score) => recordScore("sjt", score, "role")} onBack={() => setStep("quant")} />}
      {step === "role" && <RoleSimulationStep targetRole={targetRole} targetCompany={targetCompany} jobDescription={jobDescription} onDone={(score) => recordScore("role", score, "interview")} onBack={() => setStep("sjt")} />}
      {step === "interview" && <AdaptiveInterviewStep targetRole={targetRole} targetCompany={targetCompany} jobDescription={jobDescription} onDone={(score) => recordScore("interview", score, "results")} onBack={() => setStep("role")} />}
      {step === "results" && <ResultsStep scores={scores} user={user} saved={saved} />}
    </div>
  );
}

function VoiceCoach({ text }: { text: string }) {
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const stored = window.localStorage.getItem("resumeefy_assessment_voice");
    if (stored === "off") setEnabled(false);
  }, []);

  useEffect(() => {
    if (!enabled || !text.trim()) return;
    let cancelled = false;
    const speak = async () => {
      setSpeaking(true);
      try {
        let url = cacheRef.current.get(text);
        if (!url) {
          const response = await fetch("/api/ai?action=tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tts", text }) });
          if (!response.ok) throw new Error("Voice service unavailable");
          url = URL.createObjectURL(await response.blob());
          cacheRef.current.set(text, url);
        }
        if (cancelled) return;
        audioRef.current?.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        await audio.play();
      } catch {
        if (!cancelled && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1;
          utterance.pitch = 1.05;
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v => /female|samantha|zira|google uk english female|google us english/i.test(v.name));
          if (preferred) utterance.voice = preferred;
          utterance.onend = () => setSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else setSpeaking(false);
      }
    };
    void speak();
    return () => { cancelled = true; audioRef.current?.pause(); };
  }, [text, enabled]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem("resumeefy_assessment_voice", next ? "on" : "off");
    if (!next) { audioRef.current?.pause(); window.speechSynthesis?.cancel(); setSpeaking(false); }
  }

  return <div className="voice-coach" aria-label="Assessment voice controls">
    <button type="button" className={`voice-toggle ${enabled ? "active" : ""}`} onClick={toggle} aria-pressed={enabled}>
      <span className="voice-orb" aria-hidden="true">{speaking ? "◼" : "◖"}</span>
      <span><b>{enabled ? "Voice on" : "Voice off"}</b><small>{enabled ? "AI coach · natural pace" : "Tap to enable voice"}</small></span>
      <span className="voice-switch" aria-hidden="true"><i /></span>
    </button>
  </div>;
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function BehavioralStep({ prompts, onDone, onBack }: { prompts: string[]; onDone: (score: number) => void; onBack: () => void }) {
  const [i, setI] = useState(0); const [text, setText] = useState(""); const [total, setTotal] = useState(0);
  const check = text.trim().split(/\s+/).filter(Boolean).length >= 15 ? analyzeStarAnswer(text) : null;
  function next() { const score = check?.score ?? 30; const newTotal = total + score; if (i < prompts.length - 1) { setTotal(newTotal); setI(i + 1); setText(""); } else onDone(Math.round(newTotal / prompts.length)); }
  return <div className="card p-8 max-w-3xl mx-auto">
    <VoiceCoach text={prompts[i]} />
    <div className="text-xs font-bold text-[var(--coral)] mb-2">BEHAVIORAL · {i + 1} of {prompts.length}</div>
    <h2 className="font-display text-xl font-semibold">{prompts[i]}</h2>
    <textarea aria-label="STAR answer" className="input mt-4 min-h-[170px]" placeholder="Situation: ... Task: ... Action: ... Result: ..." value={text} onChange={(e) => setText(e.target.value)} />
    <div className="flex justify-between text-xs text-[var(--ink-soft)] mt-2"><span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span><span>Aim for 60+ words</span></div>
    {check && <p className={`text-sm mt-3 p-3 rounded-lg ${check.tone === "good" ? "bg-[var(--mint)]/15 text-[#087a9b]" : "bg-[var(--amber)]/15 text-[#8b7100]"}`}>{check.message}</p>}
    <div className="mod-nav"><button className="btn btn-ghost" onClick={onBack}>← Previous</button><button className="btn btn-primary" disabled={!check} onClick={next}>{i < prompts.length - 1 ? "Next →" : "Continue →"}</button></div>
  </div>;
}

function MCQStep({ title, questions, onDone, onBack }: { title: string; questions: MCQQuestion[]; onDone: (score: number) => void; onBack: () => void }) {
  const [i, setI] = useState(0); const [picked, setPicked] = useState<number | null>(null); const [correctCount, setCorrectCount] = useState(0);
  const q = questions[i];
  function pick(idx: number) { if (picked !== null) return; setPicked(idx); if (idx === q.correct) setCorrectCount((c) => c + 1); }
  function next() { if (i < questions.length - 1) { setI(i + 1); setPicked(null); } else onDone(Math.round(((correctCount + (picked === q.correct ? 1 : 0)) / questions.length) * 100)); }
  return <div className="card p-8 max-w-3xl mx-auto">
    <VoiceCoach text={q?.q || title} />
    <div className="text-xs font-bold text-[var(--blue)] mb-2">{title.toUpperCase()} · {i + 1} of {questions.length}</div>
    {q.passage && <p className="text-sm bg-[var(--paper-dim)] p-4 rounded-lg mb-3">{q.passage}</p>}
    <h2 className="font-display text-xl font-semibold">{q.q}</h2>
    <div className="mt-5 space-y-2">{q.options.map((opt, idx) => { const state = picked === null ? "" : idx === q.correct ? "correct" : idx === picked ? "wrong" : ""; return <button key={idx} aria-label={`Option ${String.fromCharCode(65 + idx)}: ${opt}`} onClick={() => pick(idx)} className={`assessment-option ${state}`}>{String.fromCharCode(65 + idx)}. {opt}</button>; })}</div>
    {picked !== null && <p className="text-sm text-[var(--ink-soft)] mt-4 p-3 rounded-lg bg-[var(--paper-dim)]">{picked === q.correct ? "✓ Correct, " : "✗ Not quite, "}{q.explain}</p>}
    <div className="mod-nav"><button className="btn btn-ghost" onClick={onBack}>← Previous</button><button className="btn btn-primary" disabled={picked === null} onClick={next}>{i < questions.length - 1 ? "Next →" : "Continue →"}</button></div>
  </div>;
}

function RoleSimulationStep({ targetRole, targetCompany, jobDescription, onDone, onBack }: { targetRole: string; targetCompany: string; jobDescription: string; onDone: (score: number) => void; onBack: () => void }) {
  const family = roleFamily(targetRole); const scenario = ROLE_SCENARIOS[family]; const [picked, setPicked] = useState<number | null>(null);
  const company = targetCompany.trim() || "the company";
  return <div className="card p-8 max-w-3xl mx-auto">
    <VoiceCoach text={`${scenario.scenario.replace("{company}", company)} Choose the response that best reflects how you would act at work.`} />
    <div className="text-xs font-bold text-[var(--mint)] mb-2">ROLE SIMULATION</div>
    <h2 className="font-display text-xl font-semibold">Role Simulation</h2>
    <p className="text-sm text-[var(--ink-soft)] mt-2">{scenario.scenario.replace("{company}", company)}</p>
    <div className="mt-5 space-y-3">{scenario.choices.map((choice, i) => <button key={i} onClick={() => setPicked(i)} className={`assessment-option sim-choice ${picked === i ? "picked" : ""}`}>{choice.text}</button>)}</div>
    {picked !== null && <div className="sim-outcome"><strong>{scenario.choices[picked].quality === "best" ? "Strong choice." : scenario.choices[picked].quality === "ok" ? "Acceptable, but it can be stronger." : "Not the best response."}</strong><br />{scenario.choices[picked].outcome}</div>}
    <div className="mod-nav"><button className="btn btn-ghost" onClick={onBack}>← Previous</button><button className="btn btn-primary" disabled={picked === null} onClick={() => onDone(picked === null ? 60 : ({ best: 95, ok: 70, poor: 40 }[scenario.choices[picked].quality]))}>Finish →</button></div>
  </div>;
}

function DesktopStep({ elapsed, targetRole, jobDescription, onDone, onBack }: { elapsed: number; targetRole: string; jobDescription: string; onDone: (score: number) => void; onBack: () => void }) {
  const fallbackScenario = useMemo(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)], []);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [taskScores, setTaskScores] = useState<number[]>([]);
  const [scenario, setScenario] = useState<any>(null);
  const [stage, setStage] = useState<"search" | "results" | "page">("search");
  const [app, setApp] = useState<"browser" | "mail" | "sheets" | "notes" | "calc" | "bin" | null>(null);
  const [mail, setMail] = useState<"inbox" | "read" | "compose" | "sent">("inbox");
  const [copied, setCopied] = useState(false); const [sent, setSent] = useState(false); const [status, setStatus] = useState("Pending"); const [time, setTime] = useState(""); const [saved, setSaved] = useState(false); const [mistakes, setMistakes] = useState(0); const [decorative, setDecorative] = useState(0);
  useEffect(() => { let active=true; api<any>("/api/ai?action=desktop", {method:"POST", body:JSON.stringify({action:"desktop",targetRole,jobDescription:jobDescription||undefined})}).then(r=>{if(active){const next=r.tasks||[];setScenarios(next);setTaskScores([]);setTaskIndex(0);setScenario(next[0]||fallbackScenario)}}).catch(()=>{if(active){setScenarios([fallbackScenario,fallbackScenario,fallbackScenario]);setScenario(fallbackScenario)}}); return ()=>{active=false}; }, [targetRole, jobDescription, fallbackScenario]);
  useEffect(()=>{setScenario(scenarios[taskIndex]||null);setStage("search");setApp(null);setMail("inbox");setCopied(false);setSent(false);setSaved(false);setMistakes(0);setDecorative(0);setStatus("Pending");setTime("");},[taskIndex,scenarios]);
  if (!scenario) return <div className="card p-8 max-w-3xl mx-auto text-center"><VoiceCoach text="I am building a desktop task around your target role and the tools it is likely to use." /><h2 className="font-display text-xl font-semibold">Generating your workplace simulation…</h2><p className="text-sm text-[var(--ink-soft)] mt-2">Your software, task and workflow are being tailored.</p></div>;
  const done = [stage === "page", copied, sent, saved];
  const submit = () => { const completed = done.filter(Boolean).length; let score = 100 - decorative * 3 - mistakes * 4; if (completed < 3) score = Math.min(score, 55); if (elapsed < 150) score += 5; if (elapsed > 255) score -= 5; const taskScore=Math.max(60, Math.min(100, score)); const nextScores=[...taskScores,taskScore]; setTaskScores(nextScores); if(taskIndex < scenarios.length-1){ setTaskIndex(v=>v+1); } else { onDone(Math.round(nextScores.reduce((a,b)=>a+b,0)/nextScores.length)); } };
  return <div className="desktop-sim-grid max-w-5xl mx-auto">
    <div className="card p-6 desktop-checklist"><VoiceCoach text={scenario.task} /><div className="text-xs font-bold text-[var(--blue)]">DESKTOP SIMULATION · TASK {taskIndex+1} OF {Math.max(3,scenarios.length)}</div><h2 className="font-display text-xl font-semibold mt-2">{scenario.name}</h2><p className="text-sm text-[var(--ink-soft)] mt-2">{scenario.task}</p><div className="mt-3 rounded-2xl bg-[var(--blue-dim)] p-4 text-sm font-semibold">Start by reading the brief. Then <strong>open the app yourself</strong>. Nothing is opened automatically.</div><div className="mt-5 space-y-3">{scenario.checklist.map((item:string, i:number) => { const states=[stage !== "search", copied, sent, saved]; return <div key={i} className={`cl-item ${states[i] ? "done" : ""}`}><span>{states[i] ? "✓" : i + 1}</span>{item}</div>})}</div><button className="btn btn-primary w-full justify-center mt-5" disabled={!saved} onClick={submit}>{taskIndex < scenarios.length-1 ? "Submit task and continue →" : "Submit final task →"}</button></div>
    <div className="dsim-screen"><div className="dsim-topbar">Resumeefy Desktop Simulation</div><div className="dsim-desktop">
      {(["browser", "mail", "sheets", "notes", "calc", "bin"] as const).map((name,idx) => { const labels = scenario.software?.length ? scenario.software : ["Browser","Mail","Spreadsheet","Notes","Calculator","Files"]; const label = labels[Math.min(idx, labels.length-1)]; const locked = (name === "mail" && !copied) || (name === "sheets" && !sent); return <button key={name} disabled={locked} title={label} className={`dsim-app ${locked ? "locked" : ""}`} onClick={() => { if (["notes", "calc", "bin"].includes(name)) setDecorative(v => v + 1); else setApp(name); }}><span className="app-icon">{name === "browser" ? <img src="/brand/apps/chrome.svg" alt="" /> : name === "mail" ? <img src="/brand/apps/gmail.svg" alt="" /> : name === "sheets" ? <img src="/brand/apps/sheets.svg" alt="" /> : name === "notes" ? "✎" : name === "calc" ? "＋" : "♲"}</span>{label}</button>; })}
    </div>
    {app && <div className="dsim-window"><div className="dwin-bar"><b>{app[0].toUpperCase() + app.slice(1)}</b><button onClick={() => setApp(null)} aria-label="Close window">✕</button></div>
      {app === "browser" && <BrowserPanel stage={stage} setStage={setStage} scenario={scenario} setCopied={setCopied} setApp={setApp} />}
      {app === "mail" && <MailPanel stage={mail} setStage={setMail} scenario={scenario} copied={copied} setSent={setSent} setApp={setApp} mistakes={mistakes} setMistakes={setMistakes} />}
      {app === "sheets" && <SheetsPanel scenario={scenario} status={status} setStatus={setStatus} time={time} setTime={setTime} saved={saved} setSaved={setSaved} elapsed={elapsed} mistakes={mistakes} setMistakes={setMistakes} setApp={setApp} />}
    </div>}
    <div className="dsim-taskbar"><span>Start</span><span>{formatTime(elapsed)}</span></div></div><div className="mod-nav"><button className="btn btn-ghost" onClick={onBack}>← Previous</button></div></div>;
}

function BrowserPanel({ stage, setStage, scenario, setCopied, setApp }: any) { return <div className="dwin-body">{stage === "search" && <><div className="browser-bar"><input defaultValue={scenario.searchQuery} aria-label="Search" /><button className="btn-sm" onClick={() => setStage("results")}>Search</button></div></>}{stage === "results" && <><div className="search-result" onClick={() => setStage("page")}><b>{scenario.resultUrl}</b><strong>{scenario.resultTitle}</strong></div>{scenario.otherResults.map((r: any) => <div className="search-result" key={r.url}><b>{r.url}</b><strong>{r.title}</strong></div>)}</>}{stage === "page" && <><h3>{scenario.pageTitle}</h3><p>{scenario.pageBody}</p><div className="contact-box"><code>{scenario.copyValue}</code><button className="btn-sm" onClick={() => { setCopied(true); setApp("mail"); }}>Copy {scenario.copyLabel.replace("Copy ", "")}</button></div></>}</div>; }
function MailPanel({ stage, setStage, scenario, copied, setSent, setApp, mistakes, setMistakes }: any) { const [pasted, setPasted] = useState(false); return <div className="dwin-body">{stage === "inbox" && <button className="mail-list-item" onClick={() => setStage("read")}><b>{scenario.from} &lt;{scenario.fromEmail}&gt;</b><span>{scenario.subject} {scenario.preview}</span></button>}{stage === "read" && <><p><b>From:</b> {scenario.from} &lt;{scenario.fromEmail}&gt;<br /><b>Subject:</b> {scenario.subject}</p><p>{scenario.fullMessage}</p><button className="btn-sm" onClick={() => setStage("compose")}>Reply</button></>}{stage === "compose" && <><label>FROM</label><div className="field-with-btn"><input value={pasted ? scenario.copyValue : ""} readOnly aria-label="Recipient/reference" /><button className="btn-sm" onClick={() => copied ? setPasted(true) : setMistakes((v: number) => v + 1)}>Paste</button></div><label className="mt-4 block">MESSAGE</label><textarea defaultValue={scenario.replyTemplate} aria-label="Reply message" /><button className="btn-sm mt-3" disabled={!pasted} onClick={() => { setSent(true); setStage("sent"); setApp("sheets"); }}>Send</button></>}{stage === "sent" && <div className="sent-state">✓ Sent to {scenario.from}</div>}</div>; }
function SheetsPanel({ scenario, status, setStatus, time, setTime, saved, setSaved, elapsed, mistakes, setMistakes, setApp }: any) { return <div className="dwin-body"><table className="sheet"><tbody><tr><th>{scenario.sheetCols[0]}</th><th>{scenario.sheetCols[1]}</th><th>{scenario.sheetCols[2]}</th></tr><tr><td>{scenario.sheetCandidate}</td><td><select value={status} onChange={e => setStatus(e.target.value)}><option>Pending</option><option>{scenario.statusOptions[1]}</option></select></td><td><div className="field-with-btn"><input value={time} readOnly placeholder="—" /><button className="btn-sm" onClick={() => setTime(formatTime(elapsed))}>Paste Timer</button></div></td></tr></tbody></table><button className="btn-sm mt-4" onClick={() => { if (status !== scenario.statusOptions[1] || !time) { setMistakes((v: number) => v + 1); return; } setSaved(true); setApp(null); }}>Save</button>{saved && <p className="text-sm text-[var(--mint)] mt-3">Row saved.</p>}</div>; }

function AdaptiveInterviewStep({ targetRole, targetCompany, jobDescription, onDone, onBack }: { targetRole: string; targetCompany: string; jobDescription: string; onDone: (score: number) => void; onBack: () => void }) {
  type Question = { id: string; type: string; question: string; whyItMatters: string; followUp: string; strongAnswerSignals: string[] };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; strengths: string[]; improvements: string[]; betterAnswer: string; followUp: string } | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await api<{ questions: Question[] }>("/api/ai?action=interview_questions", { method: "POST", body: JSON.stringify({ action: "interview_questions", targetRole, targetCompany, jobDescription }) });
        if (active) setQuestions(result.questions);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not generate interview questions."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [targetRole, targetCompany, jobDescription]);

  async function evaluate() {
    if (!answer.trim() || !questions[i]) return;
    setLoading(true);
    try {
      const result = await api<{ score: number; strengths: string[]; improvements: string[]; betterAnswer: string; followUp: string }>("/api/ai?action=interview_feedback", { method: "POST", body: JSON.stringify({ action: "interview_feedback", question: questions[i].question, answer, targetRole, targetCompany, jobDescription }) });
      setFeedback(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not evaluate your answer."); }
    finally { setLoading(false); }
  }

  function next() {
    if (!feedback) return;
    const nextScores = [...scores, feedback.score];
    if (i < questions.length - 1) { setScores(nextScores); setI(i + 1); setAnswer(""); setFeedback(null); setError(""); }
    else onDone(Math.round(nextScores.reduce((a, b) => a + b, 0) / nextScores.length));
  }

  if (loading && !questions.length) return <div className="card p-8 max-w-3xl mx-auto text-center"><h2 className="font-display text-xl font-semibold">Building your interview...</h2><p className="text-sm text-[var(--ink-soft)] mt-2">Questions are being tailored to {targetRole}.</p></div>;
  if (error && !questions.length) return <div className="card p-8 max-w-3xl mx-auto"><h2 className="font-display text-xl font-semibold">Interview coach unavailable</h2><p className="text-sm text-red-600 mt-2">{error}</p><button className="btn btn-ghost mt-5" onClick={onBack}>← Back</button></div>;
  const q = questions[i];
  return <div className="card p-8 max-w-3xl mx-auto">
    <div className="assessment-interview-head">
      <VoiceCoach text={feedback ? `Feedback: ${feedback.followUp || q.followUp}` : q.question} />
      <div className="ai-coach-mini"><Image src="/illustrations/assessment-coach.svg" alt="" width={150} height={122} /></div>
    </div>
    <div className="flex items-center justify-between gap-3"><div className="text-xs font-bold text-[var(--violet)]">AI INTERVIEW COACH · {i + 1} OF {questions.length}</div><span className="text-xs rounded-full px-3 py-1 bg-[var(--paper-dim)]">{q.type}</span></div>
    <h2 className="font-display text-xl font-semibold mt-3">{q.question}</h2>
    <p className="text-xs text-[var(--ink-soft)] mt-2">Why it matters: {q.whyItMatters}</p>
    {!feedback ? <><textarea className="input mt-5 min-h-[180px]" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer as if you are in the real interview. Use a specific example where possible." /><div className="text-xs text-[var(--ink-soft)] mt-2">Tip: use Situation, Task, Action and Result when the question asks for an example.</div><div className="mod-nav"><button className="btn btn-ghost" onClick={onBack}>← Previous</button><button className="btn btn-primary" disabled={answer.trim().length < 20 || loading} onClick={() => void evaluate()}>{loading ? "Evaluating…" : "Get instant feedback →"}</button></div></> : <div className="mt-5 space-y-4"><div className="rounded-xl bg-[var(--paper-dim)] p-4"><div className="text-xs font-bold">ANSWER SCORE</div><div className="font-display text-3xl font-semibold mt-1">{feedback.score}/100</div></div><div><div className="text-sm font-bold">What worked</div><ul className="text-sm mt-2 space-y-1">{feedback.strengths.map(x => <li key={x}>✓ {x}</li>)}</ul></div><div><div className="text-sm font-bold">Improve next time</div><ul className="text-sm mt-2 space-y-1">{feedback.improvements.map(x => <li key={x}>• {x}</li>)}</ul></div><div className="rounded-xl border border-[var(--line)] p-4"><div className="text-xs font-bold">STRONGER VERSION</div><p className="text-sm mt-2">{feedback.betterAnswer}</p></div><div className="rounded-xl bg-[var(--blue-dim)] p-4"><div className="text-xs font-bold">FOLLOW UP</div><p className="text-sm mt-1">{feedback.followUp || q.followUp}</p></div><button className="btn btn-primary w-full justify-center" onClick={next}>{i < questions.length - 1 ? "Next question →" : "Finish interview →"}</button></div>}
    {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
  </div>;
}

function ResultsStep({ scores, user, saved }: { scores: Record<string, number>; user: CurrentUser; saved: boolean }) {
  const values = Object.values(scores);
  const overall = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const certId = `RSMFY-${Date.now().toString(36).toUpperCase()}`;
  const strongest = MODULES.reduce((a, b) => (scores[b.id] ?? 0) > (scores[a.id] ?? 0) ? b : a, MODULES[0]);
  const weakest = MODULES.reduce((a, b) => (scores[b.id] ?? 0) < (scores[a.id] ?? 0) ? b : a, MODULES[0]);
  const displayName = user?.name || "Resumeefy Candidate";

  return <div className="max-w-4xl mx-auto">
    <div className="text-center py-8">
      <div className="w-36 h-36 rounded-full mx-auto flex items-center justify-center text-4xl font-display font-semibold" style={{ background: `conic-gradient(var(--mint) ${overall}%, var(--paper-dim) 0)` }}>
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">{overall}</div>
      </div>
      <h1 className="font-display text-2xl font-semibold mt-6">Your Readiness Score</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-lg mx-auto">Strongest in <b>{strongest.name}</b>. Focus your next session on <b>{weakest.name}</b> for the biggest jump.</p>
    </div>

    <div className="card p-6">
      <RadarChart scores={scores} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
        {MODULES.map(m => <div key={m.id} className="bg-[var(--paper-dim)] rounded-xl p-3 text-center"><div className="text-xs font-bold text-[var(--ink-soft)]">{m.name}</div><div className="font-display text-xl font-semibold">{scores[m.id] ?? 0}</div></div>)}
      </div>
    </div>

    {!user ? <div className="mt-6 bg-[var(--blue-dim)] rounded-xl p-5 text-left"><p className="text-sm font-bold">Create a free account to save this result</p><Link href="/signup" className="btn btn-primary mt-4">Create account →</Link></div> : <p className="text-sm text-[var(--ink-soft)] text-center mt-5">{saved ? "Saved to your account." : "Saving…"}</p>}

    <CertificateCard scores={scores} overall={overall} certId={certId} defaultName={displayName} user={user} />
    <Link href="/resume-builder" className="btn btn-ghost mt-4 w-full justify-center">Now build your resume →</Link>
  </div>;
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const cx = 160, cy = 150, r = 105, n = MODULES.length;
  const point = (i: number, value: number) => { const a = (-90 + i * 360 / n) * Math.PI / 180; return [cx + value / 100 * r * Math.cos(a), cy + value / 100 * r * Math.sin(a)]; };
  const polygon = (factor: number) => MODULES.map((_, i) => point(i, factor * 100).join(",")).join(" ");
  const data = MODULES.map((m, i) => point(i, scores[m.id] ?? 0).join(",")).join(" ");
  return <svg viewBox="0 0 320 300" className="w-full max-w-md mx-auto" role="img" aria-label="Readiness score radar chart">
    {[.33,.66,1].map(f => <polygon key={f} points={polygon(f)} fill="none" stroke="var(--line)" strokeWidth="1" />)}
    {MODULES.map((_, i) => { const [x,y] = point(i,100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />; })}
    <polygon points={data} fill="rgba(23,195,178,.22)" stroke="var(--mint)" strokeWidth="2.5" />
    {MODULES.map((m,i) => { const [x,y] = point(i, scores[m.id] ?? 0); return <circle key={m.id} cx={x} cy={y} r="4" fill="var(--mint)" />; })}
    {MODULES.map((m,i) => { const [x,y] = point(i,118); return <text key={m.id} x={x} y={y} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-soft)">{m.name}</text>; })}
  </svg>;
}

function CertificateCard({ scores, overall, certId, defaultName, user }: { scores: Record<string, number>; overall: number; certId: string; defaultName: string; user: CurrentUser }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");

  useEffect(() => { drawCertificate(canvasRef.current, name, scores, overall, certId); }, [name, scores, overall, certId]);

  function download() {
    if (!user) { setMessage("Create an account first to download your certificate."); return; }
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement("a"); link.download = `resumeefy-certificate-${certId}.png`; link.href = canvas.toDataURL("image/png"); link.click();
    setMessage("Certificate download started.");
  }
  function shareLinkedIn() {
    const caption = `I just completed my Resumeefy job-readiness assessment and scored ${overall}/100. Practice the interview before it happens: https://resumeefy.site`;
    navigator.clipboard?.writeText(caption).catch(() => {});
    window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent("https://resumeefy.site"), "_blank", "noopener,noreferrer");
    setMessage("Caption copied. Paste it into your LinkedIn post.");
  }
  function openFull() { const canvas = canvasRef.current; if (!canvas) return; const w = window.open(); if (w) w.document.write(`<title>Resumeefy Certificate</title><img src="${canvas.toDataURL("image/png")}" style="width:100%">`); }

  return <div className="card p-6 mt-7 text-center">
    <div className="text-xs font-bold text-[var(--ink-soft)] mb-4">🎓 CERTIFICATE OF READINESS</div>
    <canvas ref={canvasRef} className="certificate-canvas" aria-label="Resumeefy Certificate of Readiness" />
    <input aria-label="Certificate name" className="input mt-4 max-w-sm text-center" value={name} onChange={e => setName(e.target.value)} placeholder="Type your name to personalize it" />
    <div className="flex gap-2 justify-center flex-wrap mt-4">
      <button className="btn btn-primary" onClick={download}>⬇ Download Certificate</button>
      <button className="btn btn-ghost" onClick={shareLinkedIn}>Share on LinkedIn</button>
      <button className="btn btn-ghost" onClick={openFull}>Open full size</button>
    </div>
    {message && <p className="text-xs text-[var(--ink-soft)] mt-3" role="status">{message}</p>}
  </div>;
}

function drawCertificate(canvas: HTMLCanvasElement | null, name: string, scores: Record<string, number>, overall: number, certId: string) {
  if (!canvas) return;
  canvas.width = 1200; canvas.height = 800;
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  const grad = ctx.createLinearGradient(0,0,1200,800); grad.addColorStop(0,"#0A1E3D"); grad.addColorStop(1,"#000B1D"); ctx.fillStyle = grad; ctx.fillRect(0,0,1200,800);
  [[110,80,140,"#C99A3E"],[1120,90,110,"#00B4FC"],[1080,730,160,"#0825A8"],[70,720,100,"#FFD700"]].forEach(([x,y,r,c]) => { ctx.beginPath(); ctx.arc(x as number,y as number,r as number,0,Math.PI*2); ctx.fillStyle=(c as string)+"22"; ctx.fill(); });
  ctx.strokeStyle="rgba(255,255,255,.22)"; ctx.lineWidth=2; ctx.strokeRect(34,34,1132,732);
  ctx.textAlign="center"; ctx.fillStyle="#ffd700"; ctx.font="700 22px Georgia"; ctx.fillText("RESUMEEFY",600,95);
  ctx.fillStyle="#fff"; ctx.font="700 38px Georgia"; ctx.fillText("Certificate of Readiness",600,170);
  ctx.font="400 17px Georgia"; ctx.fillStyle="rgba(255,255,255,.72)"; ctx.fillText("This certifies that",600,205);
  ctx.font="700 40px Georgia"; ctx.fillStyle="#fff"; ctx.fillText(name || "Resumeefy Candidate",600,254);
  ctx.font="400 16px Georgia"; ctx.fillStyle="rgba(255,255,255,.68)"; ctx.fillText("has completed the Resumeefy job-readiness assessment",600,282);
  const cx=330,cy=470,R=130,n=MODULES.length;
  const pt=(i:number,val:number):[number,number]=>{ const a=(-90+i*360/n)*Math.PI/180; return [cx+val/100*R*Math.cos(a),cy+val/100*R*Math.sin(a)]; };
  [.33,.66,1].forEach(f=>{ ctx.beginPath(); MODULES.forEach((_,i)=>{const [x,y]=pt(i,f*100); i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.closePath(); ctx.strokeStyle="rgba(255,255,255,.14)"; ctx.lineWidth=1.2; ctx.stroke(); });
  MODULES.forEach((_,i)=>{const [x,y]=pt(i,100);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.strokeStyle="rgba(255,255,255,.14)";ctx.stroke();});
  ctx.beginPath(); MODULES.forEach((m,i)=>{const [x,y]=pt(i,scores[m.id]??0);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.fillStyle="rgba(23,195,178,.28)";ctx.fill();ctx.strokeStyle="#00B4FC";ctx.lineWidth=2.4;ctx.stroke();
  MODULES.forEach((m,i)=>{const [x,y]=pt(i,scores[m.id]??0);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();});
  const rx=890,ry=460,rr=90; ctx.beginPath();ctx.arc(rx,ry,rr,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.15)";ctx.lineWidth=15;ctx.stroke();ctx.beginPath();ctx.arc(rx,ry,rr,-Math.PI/2,-Math.PI/2+overall/100*Math.PI*2);ctx.strokeStyle="#ffd700";ctx.lineWidth=15;ctx.lineCap="round";ctx.stroke();ctx.font="700 48px Georgia";ctx.fillStyle="#fff";ctx.fillText(String(overall),rx,ry+16);ctx.font="400 13px Georgia";ctx.fillStyle="rgba(255,255,255,.6)";ctx.fillText("READINESS SCORE",rx,ry+50);
  ctx.textAlign="left"; MODULES.forEach((m,i)=>{const mx=740,my=590+i*30;ctx.fillStyle=hexColor(m.color);ctx.fillRect(mx,my-11,12,12);ctx.font="400 15px Georgia";ctx.fillStyle="rgba(255,255,255,.85)";ctx.fillText(m.name+":",mx+20,my);ctx.font="700 15px Georgia";ctx.fillStyle="#fff";ctx.fillText(String(scores[m.id]??0),mx+150,my);});
  ctx.textAlign="center";ctx.font="400 13px Georgia";ctx.fillStyle="rgba(255,255,255,.5)";ctx.fillText(`ID ${certId} · Issued ${new Date().toLocaleDateString()} · resumeefy.com`,600,758);
}
function hexColor(name: string) { return ({blue:"#0A2FCC",violet:"#0825A8",coral:"#C99A3E",amber:"#FFD700",mint:"#00B4FC"} as Record<string,string>)[name] || "#0A2FCC"; }
