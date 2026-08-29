'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

interface NavBarProps {
  links?: NavLink[];
  rightContent?: React.ReactNode;
}

// Only routes that exist under app/. A nav that points at `#` is the same dead
// end as a card that does not navigate.
const defaultLinks: NavLink[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Wallet", href: "/wallet" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function NavBar({
  links = defaultLinks,
  rightContent,
}: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Close on navigation, so the panel never covers the page the buyer landed
  // on. Adjusting state during render is React's own answer here: an effect
  // would paint the stale open panel for a frame first.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (pathname !== renderedPath) {
    setRenderedPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      // Focus would otherwise be left on a node that just became hidden.
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // `active` styles the section a page belongs to, which is not the same claim
  // as aria-current="page": on /assets/<id> the Marketplace link is highlighted
  // but it is not the current page.
  const currentPage = (link: NavLink) =>
    link.href === pathname ? ('page' as const) : undefined;

  const linkClass = (link: NavLink) =>
    `rounded-full px-3 py-2 text-sm transition-all duration-200 focus-ring ${
      link.active
        ? "bg-white/6 text-primary ring-1 ring-accent/20"
        : "text-on-surface-variant hover:bg-white/5 hover:text-primary"
    }`;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-background/72 backdrop-blur-2xl">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <Link href="/marketplace" className="focus-ring flex items-center gap-3 rounded-full">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(95,251,241,0.25),rgba(255,255,255,0.02))] shadow-[0_0_28px_rgba(95,251,241,0.12)]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9L5.2 10.3l4.9-1.9z" />
            </svg>
          </span>
          <span className="font-heading text-[22px] font-semibold tracking-tight text-primary">
            AgentVerse
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentPage(link)}
              className={linkClass(link)}
            >
              {link.label}
            </Link>
          ))}
          {rightContent}
        </div>

        <button
          type="button"
          ref={toggleRef}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full text-primary md:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* The wallet and sign-in controls live in `rightContent`, so the mobile
          panel has to render them too: without this the purchase journey is
          unreachable below the md breakpoint. */}
      <div
        id={menuId}
        hidden={!menuOpen}
        className="border-t border-outline-variant/20 bg-background/95 md:hidden"
      >
        <div className="page-shell flex flex-col gap-2 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentPage(link)}
              className={`${linkClass(link)} min-h-[44px] leading-[28px]`}
            >
              {link.label}
            </Link>
          ))}
          {rightContent ? <div className="pt-2">{rightContent}</div> : null}
        </div>
      </div>
    </nav>
  );
}
