export function CreditCoin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="rf-coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD35A" />
          <stop offset="1" stopColor="#FFA53D" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#rf-coin)" stroke="#B8790F" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#B8790F" strokeWidth="1" opacity="0.5" />
      <path
        d="M16 9.5c-1.9 0-3.3 1-3.3 2.3 0 3.1 6.2 1.9 6.2 5.1 0 1.4-1.5 2.4-3.3 2.4-1.5 0-2.8-.7-3.3-1.7M16 8v1.3M16 21.3v1.2"
        fill="none"
        stroke="#8A5600"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
