import Link from "next/link";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

interface FooterProps {
  columns?: FooterColumn[];
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Documentation", href: "#" },
      { label: "Creators", href: "#" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Stellar Network", href: "#" },
      { label: "Governance", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export default function Footer({ columns = defaultColumns }: FooterProps) {
  return (
    <footer className="w-full border-t border-outline-variant/10 bg-background/80 py-20 backdrop-blur">
      <div className="page-shell flex flex-col justify-between gap-10 md:flex-row">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-white/5">
              <span className="material-symbols-outlined text-[16px] text-accent">
                auto_awesome
              </span>
            </div>
            <span className="font-heading text-[22px] font-semibold text-primary">
              AgentVerse
            </span>
          </div>
          <p className="max-w-sm text-body-md text-on-surface-variant">
            The decentralized marketplace for sovereign intelligence and
            autonomous workflows.
          </p>
          <p className="mt-8 text-label-sm text-label-sm text-on-surface-variant/70">
            &copy; 2026 AgentVerse. Powered by Stellar.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <span className="text-label-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {col.title}
              </span>
              {col.links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-body-md text-on-surface-variant transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
