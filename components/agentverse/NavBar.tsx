'use client';

import Link from "next/link";

interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

interface NavBarProps {
  links?: NavLink[];
  rightContent?: React.ReactNode;
}

const defaultLinks: NavLink[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Documentation", href: "#" },
  { label: "Creators", href: "#" },
];

export default function NavBar({
  links = defaultLinks,
  rightContent,
}: NavBarProps) {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background/72 backdrop-blur-2xl">
      <div className="page-shell flex h-20 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(95,251,241,0.25),rgba(255,255,255,0.02))] shadow-[0_0_28px_rgba(95,251,241,0.12)]">
            <span className="material-symbols-outlined text-[20px] text-accent">
              auto_awesome
            </span>
          </div>
          <span className="font-heading text-[22px] font-semibold tracking-tight text-primary">
            AgentVerse
          </span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm transition-all duration-200 focus-ring ${
                link.active
                  ? "bg-white/6 text-primary ring-1 ring-accent/20"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {rightContent || (
            <button className="focus-ring inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">
              Launch App
            </button>
          )}
        </div>
        <button className="md:hidden text-primary focus-ring" aria-label="Open navigation menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}
