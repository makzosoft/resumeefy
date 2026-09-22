/**
 * Original icon set for the Resumeefy Desktop Simulation.
 *
 * These are deliberately NOT recreations of real software logos (the app
 * previously shipped near-exact copies of Chrome/Gmail/Sheets branding,
 * including their official hex colors — that's been replaced). Each icon
 * instead uses a distinct color + a simple, generic glyph (envelope, grid,
 * page, compass) that reads clearly at a glance without tracing anyone's
 * trademark. The visual language (rounded square badge, soft shadow, white
 * glyph) is shared across all of them so the simulated desktop feels like
 * one coherent, polished product.
 */
import type { CSSProperties } from "react";

type IconProps = { size?: number; className?: string; style?: CSSProperties };

function Badge({
  size = 26,
  gradientId,
  colors,
  className,
  style,
  children,
}: IconProps & { gradientId: string; colors: [string, string]; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#${gradientId})`} />
      {children}
    </svg>
  );
}

export function BrowserIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-browser" colors={["#3355F5", "#7B3FE4"]}>
      <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.9" />
      <path d="M24 11v26M11 24h26M15 15l18 18M33 15 15 33" stroke="#fff" strokeWidth="1.4" opacity="0.55" />
      <path d="M24 24 30 15l-3.5 10.5L20 30z" fill="#fff" />
    </Badge>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-mail" colors={["#F5576C", "#E64D63"]}>
      <rect x="10" y="14" width="28" height="20" rx="3.5" fill="#fff" />
      <path d="M11 15.5 24 25l13-9.5" fill="none" stroke="#E64D63" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Badge>
  );
}

export function SpreadsheetIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-sheet" colors={["#0FBF8F", "#00A98A"]}>
      <rect x="10" y="9" width="28" height="30" rx="3" fill="#fff" />
      <path d="M10 18h28M10 27h28M19.5 9v30M28.5 9v30" stroke="#00A98A" strokeWidth="1.6" />
    </Badge>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-doc" colors={["#2B57D9", "#0A2FCC"]}>
      <path d="M14 8h13l7 7v25a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" fill="#fff" />
      <path d="M27 8v7h7" fill="none" stroke="#0A2FCC" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 24h14M17 29h14M17 34h9" stroke="#0A2FCC" strokeWidth="1.8" strokeLinecap="round" />
    </Badge>
  );
}

export function DesignIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-design" colors={["#FF7A45", "#D6409F"]}>
      <circle cx="19" cy="19" r="7" fill="#fff" opacity="0.95" />
      <rect x="23" y="23" width="14" height="14" rx="3" fill="#fff" opacity="0.85" transform="rotate(8 30 30)" />
      <circle cx="33" cy="15" r="4.5" fill="#fff" opacity="0.7" />
    </Badge>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-folder" colors={["#FFC53D", "#FFA83D"]}>
      <path d="M9 16a2 2 0 0 1 2-2h9l3 3h14a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#fff" />
    </Badge>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-settings" colors={["#6b7a94", "#3f4a5e"]}>
      <circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" strokeWidth="2.6" />
      <g stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
        <path d="M24 10v4M24 34v4M10 24h4M34 24h4M14.5 14.5l2.8 2.8M30.7 30.7l2.8 2.8M33.5 14.5l-2.8 2.8M17.3 30.7l-2.8 2.8" />
      </g>
    </Badge>
  );
}

export function SlidesIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-slides" colors={["#00C2A8", "#0090C2"]}>
      <rect x="8" y="12" width="32" height="21" rx="2.5" fill="#fff" />
      <path d="M20 20l8 4.5-8 4.5z" fill="#0090C2" />
      <rect x="16" y="36" width="16" height="2.4" rx="1.2" fill="#fff" opacity="0.85" />
    </Badge>
  );
}

export function SupportIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-support" colors={["#FFA53D", "#FF6B6B"]}>
      <path d="M24 9c-8.3 0-15 6-15 14 0 3 1 5.7 2.7 8L10 39l8.5-2c1.7 0.6 3.6 1 5.5 1 8.3 0 15-6.3 15-14.5S32.3 9 24 9z" fill="#fff" />
      <circle cx="17.5" cy="23" r="2.3" fill="#FF6B6B" />
      <circle cx="24" cy="23" r="2.3" fill="#FF6B6B" />
      <circle cx="30.5" cy="23" r="2.3" fill="#FF6B6B" />
    </Badge>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <Badge {...props} gradientId="rf-code" colors={["#6366F1", "#4338CA"]}>
      <path d="M17 16 8 24l9 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 16l9 8-9 8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 12l-6 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
    </Badge>
  );
}
