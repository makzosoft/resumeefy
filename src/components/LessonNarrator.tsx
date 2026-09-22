"use client";
import { useEffect, useRef, useState } from "react";
import { TalkingInstructorAvatar } from "@/components/TalkingInstructorAvatar";

type VoiceProfile = { pitch: number; rate: number; preferGender: "male" | "female" };

function pickVoice(profile: VoiceProfile): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const english = voices.filter((v) => v.lang.startsWith("en"));
  const pool = english.length ? english : voices;
  // Best-effort gender match from voice name hints — browsers don't expose
  // a real gender field, so this is a heuristic, not a guarantee.
  const femaleHints = /female|zira|samantha|victoria|susan|karen|moira|tessa|fiona/i;
  const maleHints = /male|david|daniel|alex|fred|george|mark|thomas/i;
  const hints = profile.preferGender === "female" ? femaleHints : maleHints;
  return pool.find((v) => hints.test(v.name)) || pool[0];
}

function splitIntoWords(text: string): { word: string; start: number }[] {
  const out: { word: string; start: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ word: m[0], start: m.index });
  return out;
}

export function LessonNarrator({
  paragraphs,
  voiceProfile,
  gradient,
}: {
  paragraphs: string[];
  voiceProfile: VoiceProfile;
  gradient: [string, string];
}) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [activeWordStart, setActiveWordStart] = useState<number | null>(null);
  const [mouthOpen, setMouthOpen] = useState<0 | 1 | 2>(0);
  const mouthTimer = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      stoppedRef.current = true;
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
      if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    };
  }, []);

  function startMouthLoop() {
    if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    const frames: (0 | 1 | 2)[] = [1, 2, 1, 0];
    let i = 0;
    mouthTimer.current = window.setInterval(() => {
      setMouthOpen(frames[i % frames.length]);
      i++;
    }, 130);
  }
  function stopMouthLoop() {
    if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    setMouthOpen(0);
  }

  function speakParagraph(index: number) {
    if (index >= paragraphs.length) {
      setPlaying(false);
      stopMouthLoop();
      return;
    }
    const utter = new SpeechSynthesisUtterance(paragraphs[index]);
    utter.pitch = voiceProfile.pitch;
    utter.rate = voiceProfile.rate;
    const voice = pickVoice(voiceProfile);
    if (voice) utter.voice = voice;
    utter.onboundary = (e) => {
      if (e.name === "word" || e.name === undefined) setActiveWordStart(e.charIndex);
    };
    utter.onstart = () => startMouthLoop();
    utter.onend = () => {
      if (stoppedRef.current) return;
      setActiveParagraph((p) => {
        const next = p + 1;
        speakParagraph(next);
        return next;
      });
      setActiveWordStart(null);
    };
    utter.onerror = () => {
      setPlaying(false);
      stopMouthLoop();
    };
    window.speechSynthesis.speak(utter);
  }

  function play() {
    stoppedRef.current = false;
    setPlaying(true);
    window.speechSynthesis.cancel();
    speakParagraph(activeParagraph);
  }

  function pause() {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    setPlaying(false);
    stopMouthLoop();
  }

  if (!supported) return null;

  return (
    <div className="lesson-narrator">
      <div className="lesson-narrator-header">
        <TalkingInstructorAvatar gradient={gradient} size={64} mouthOpen={playing ? mouthOpen : 0} />
        <button type="button" className="lesson-narrator-btn" onClick={playing ? pause : play}>
          {playing ? "⏸ Pause narration" : "▶ Listen to this lesson"}
        </button>
      </div>
      <div className="lesson-narrator-body">
        {paragraphs.map((para, pIndex) =>
          playing && pIndex === activeParagraph ? (
            <p key={pIndex} className="mt-4 leading-relaxed lesson-narrator-active-para">
              {splitIntoWords(para).map((w, i) => {
                const isActive = activeWordStart !== null && w.start === activeWordStart;
                return (
                  <span key={i} className={isActive ? "narrator-word-active" : undefined}>
                    {w.word}{" "}
                  </span>
                );
              })}
            </p>
          ) : (
            <p key={pIndex} className={`mt-4 leading-relaxed ${playing ? "lesson-narrator-dim" : ""}`}>
              {para}
            </p>
          )
        )}
      </div>
    </div>
  );
}
