/**
 * Inline SVG icons for the market path.
 *
 * The rest of the app renders icons as `<span class="material-symbols-outlined">name</span>`,
 * but no Material Symbols font is loaded anywhere in this repo, so those spans
 * currently paint the literal word ("payments", "star", ...). The market path
 * must not depend on that, so it ships its own icons: no font, no network
 * request, no build-time dependency.
 *
 * Every icon is decorative. The accessible name always comes from the
 * surrounding text or an explicit label on the control, never from the icon.
 */

interface IconProps {
  className?: string;
}

function svgProps(className?: string) {
  return {
    className,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
  };
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <path d="M21 10.5h-4a2 2 0 0 0 0 4h4z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function ErrorIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.75" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.75h.01" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M4.5 12h15" />
      <path d="M13.5 6l6 6-6 6" />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5L11 13" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8L20 20" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

export function PromptIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 10l2.5 2-2.5 2" />
      <path d="M12.5 14.5h4" />
    </svg>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg {...svgProps(className)} className={`market-spinner ${className ?? ''}`}>
      <circle cx="12" cy="12" r="8.5" opacity="0.25" />
      <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" />
    </svg>
  );
}
