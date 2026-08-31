import Link from "next/link";
import { MARKET_V1_SCOPE_NOTE } from "@/lib/market/scope";
import { supportUrl } from "@/lib/market/support";

const REPOSITORY_URL = "https://github.com/Stellar-AgentVerse/UI";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Only destinations that exist. A footer full of `href="#"` is a page full of
// dead ends, so entries without a real target are omitted rather than stubbed.
const defaultColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Wallet", href: "/wallet" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Publish", href: "/publish" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source code", href: REPOSITORY_URL, external: true },
      { label: "Support", href: supportUrl(), external: true },
      { label: "Stellar", href: "https://stellar.org", external: true },
    ],
  },
];

export default function Footer({ columns = defaultColumns }: { columns?: FooterColumn[] }) {
  return (
    <footer className="w-full border-t border-outline-variant/10 bg-background/80 py-16 backdrop-blur">
      <div className="page-shell flex flex-col justify-between gap-10 md:flex-row">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-white/5">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-accent"
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
            <span className="font-heading text-[22px] font-semibold text-primary">
              AgentVerse
            </span>
          </div>
          <p className="max-w-sm text-body-md text-on-surface-variant">
            {MARKET_V1_SCOPE_NOTE}
          </p>
          <p className="mt-8 text-label-sm text-on-surface-variant">
            &copy; 2026 AgentVerse. Built on Stellar.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <span className="text-label-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {col.title}
              </span>
              {col.links.map((link) =>
                link.external ? (
                  <a
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring rounded text-body-md text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {link.label}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="focus-ring rounded text-body-md text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
