/**
 * Instructor avatars are deliberately illustrated, not photographic — there
 * are no real photos of these instructors because they're editorial
 * personas Resumeefy created to put a consistent voice behind each course,
 * and a stock photo pretending to be "Ngozi" or "David" would be
 * misleading. A designed monogram mark is the honest version of the same
 * idea: a memorable, consistent visual identity per instructor.
 */
export function InstructorAvatar({
  initials,
  gradient,
  size = 56,
}: {
  initials: string;
  gradient: [string, string];
  size?: number;
}) {
  const id = `ia-${initials}-${gradient[0].replace("#", "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gradient[0]} />
          <stop offset="1" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      <text x="32" y="40" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight={700} fontSize="24" fill="#fff">
        {initials}
      </text>
    </svg>
  );
}
