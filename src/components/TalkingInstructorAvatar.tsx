"use client";
/**
 * A richer companion to InstructorAvatar, purpose-built for the lesson
 * narrator: an abstract, illustrated face (not a photo, for the same
 * reason InstructorAvatar isn't one) with a mouth shape that can animate
 * while speech is playing. This is a stylized approximation of talking —
 * timed to the narrator's word boundaries, not real phoneme-accurate lip
 * sync, which would need actual audio analysis this browser TTS doesn't
 * expose.
 */
export function TalkingInstructorAvatar({
  gradient,
  size = 120,
  mouthOpen,
}: {
  gradient: [string, string];
  size?: number;
  /** 0 = closed/resting, 1 = mid-open, 2 = wide-open — cycled while speaking. */
  mouthOpen: 0 | 1 | 2;
}) {
  const id = `tia-${gradient[0].replace("#", "")}`;
  const mouthPath =
    mouthOpen === 0
      ? "M46 74q10 4 20 0"
      : mouthOpen === 1
      ? "M45 73q11 10 22 0q-4 8 -11 8q-7 0 -11 -8z"
      : "M43 71q13 16 26 0q-4 12 -13 12q-9 0 -13 -12z";
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gradient[0]} />
          <stop offset="1" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill={`url(#${id})`} />
      <circle cx="64" cy="64" r="63" fill="none" stroke="rgba(255,255,255,.25)" />
      <ellipse cx="47" cy="56" rx="5.5" ry="7" fill="#fff" opacity="0.95" />
      <ellipse cx="81" cy="56" rx="5.5" ry="7" fill="#fff" opacity="0.95" />
      <path d={mouthPath} fill="#fff" opacity="0.95" style={{ transition: "d .12s ease" }} />
    </svg>
  );
}
