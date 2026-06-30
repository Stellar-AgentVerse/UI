'use client';

import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import NavBar from "@/components/agentverse/NavBar";
import { fetchCreditPackages, fetchWalletBalance, fetchWalletTransactions, purchasePackage } from "@/lib/api";
import type { CreditPackage, WalletBalance, WalletTransaction } from "@/lib/api";

const fallbackPackages: CreditPackage[] = [
  {
    id: "1",
    name: "Starter",
    slug: "starter",
    description: "Perfect for individual developers and testing.",
    icon: "rocket_launch",
    credits: 500,
    price: 50,
    originalPrice: null,
    features: ["Standard execution speed", "Basic agent monitoring"],
    popular: false,
  },
  {
    id: "2",
    name: "Pro",
    slug: "pro",
    description: "For growing agents that need consistent power.",
    icon: "workspace_premium",
    credits: 2500,
    price: 200,
    originalPrice: 250,
    features: ["Priority execution", "Advanced analytics suite", "API sandbox access"],
    popular: true,
  },
  {
    id: "3",
    name: "Enterprise",
    slug: "enterprise",
    description: "Massive scale for high-volume workflows.",
    icon: "corporate_fare",
    credits: 10000,
    price: 800,
    originalPrice: null,
    features: ["Ultra-low latency node", "Unlimited agent deployments", "24/7 priority support"],
    popular: false,
  },
];

type DisplayTx = {
  type: string;
  typeColor: string;
  description: string;
  txid: string;
  date: string;
  amount: string;
  amountColor: string;
};

const fallbackTransactions: DisplayTx[] = [
  { type: "Purchase", typeColor: "bg-danger/20 text-danger", description: "Marketplace: Data Aggregator V2", txid: "0x82f...e31", date: "Oct 24, 2023", amount: "-120 Credits", amountColor: "text-danger" },
  { type: "Income", typeColor: "bg-accent/20 text-accent", description: "Agent Revenue: Neural-Search-Bot", txid: "0x41a...b2c", date: "Oct 23, 2023", amount: "+45.50 Credits", amountColor: "text-accent" },
  { type: "Fee", typeColor: "bg-on-surface-variant/15 text-on-surface-variant", description: "Network maintenance fee", txid: "0x111...789", date: "Oct 22, 2023", amount: "-0.50 Credits", amountColor: "text-on-surface-variant" },
  { type: "Refill", typeColor: "bg-primary/15 text-primary", description: "Resource refill: Starter Pack", txid: "0x902...a4e", date: "Oct 20, 2023", amount: "+500 Credits", amountColor: "text-primary" },
];

const fallbackBalance: WalletBalance = {
  credits: 0,
  xlmBalance: 0,
  monthlyUsage: 0,
  monthlyAllocation: 0,
  usagePercent: 0,
  xlmUsdEstimate: 0,
};

function toDisplayTx(tx: WalletTransaction): DisplayTx {
  const typeConfig: Record<string, { color: string }> = {
    PURCHASE: { color: "bg-danger/20 text-danger" },
    INCOME: { color: "bg-accent/20 text-accent" },
    FEE: { color: "bg-on-surface-variant/15 text-on-surface-variant" },
    REFILL: { color: "bg-primary/15 text-primary" },
  };
  const cfg = typeConfig[tx.type] ?? { color: "bg-on-surface-variant/15 text-on-surface-variant" };
  const isPositive = tx.amount >= 0;

  return {
    type: tx.type,
    typeColor: cfg.color,
    description: tx.description,
    txid: tx.txid,
    date: new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    amount: `${isPositive ? "+" : ""}${tx.amount.toLocaleString()} ${tx.currency}`,
    amountColor: isPositive ? "text-accent" : "text-danger",
  };
}

function PackageCard({
  pkg,
  onPurchase,
}: {
  pkg: CreditPackage;
  onPurchase: (id: string) => void;
}) {
  return (
    <GlassCard className={`relative flex h-full flex-col p-6 ${pkg.popular ? "border-accent/30 shadow-[0_20px_70px_rgba(95,251,241,0.08)]" : ""}`}>
      {pkg.popular && (
        <div className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary">
          Popular
        </div>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/20 bg-white/5 text-primary">
        <span className="material-symbols-outlined">{pkg.icon}</span>
      </div>
      <div className="mt-5">
        <h3 className="font-heading text-2xl font-semibold text-primary">{pkg.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{pkg.description}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-outline-variant/15 bg-surface-container-low/60 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Credits</div>
        <div className="mt-1 text-3xl font-semibold text-primary">{pkg.credits.toLocaleString()}</div>
        <div className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant">
          {pkg.originalPrice ? <span className="line-through opacity-60">${pkg.originalPrice}</span> : null}
          <span>${pkg.price}</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {(pkg.features ?? []).map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined mt-0.5 text-[18px] text-accent">check_circle</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onPurchase(pkg.id)}
        className={`focus-ring mt-6 rounded-full px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${pkg.popular ? "bg-accent text-on-primary hover:brightness-110" : "border border-outline-variant/25 text-primary hover:border-accent/30 hover:bg-accent/10"}`}
      >
        Buy now
      </button>
    </GlassCard>
  );
}

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>(fallbackPackages);
  const [transactions, setTransactions] = useState<DisplayTx[]>(fallbackTransactions);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletBalance()
      .then(setBalance)
      .catch(() => {
        setBalance(fallbackBalance);
        setNotice("Wallet balance unavailable right now. Showing fallback values.");
      });
    fetchCreditPackages().then(setPackages).catch(console.error);
    fetchWalletTransactions().then((apiTxs) => setTransactions(apiTxs.map(toDisplayTx))).catch(console.error);
  }, []);

  const usagePercent = useMemo(() => balance?.usagePercent ?? 0, [balance]);

  const handlePurchase = async (packageId: string) => {
    try {
      const result = await purchasePackage(packageId);
      setNotice(result.message);
      fetchWalletBalance().then(setBalance).catch(() => setBalance(fallbackBalance));
      fetchWalletTransactions().then((apiTxs) => setTransactions(apiTxs.map(toDisplayTx))).catch(console.error);
    } catch (err) {
      setNotice(`Purchase failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar
        links={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Wallet", href: "/wallet", active: true },
        ]}
        rightContent={<button className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">Launch App</button>}
      />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute bottom-0 right-[-5%] h-[18rem] w-[18rem] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <p className="section-kicker">Wallet</p>
            <h1 className="section-title text-4xl md:text-6xl">Manage credits and settlement</h1>
            <p className="section-copy max-w-2xl">
              A premium wallet surface for funding, usage tracking, and transaction history with clear hierarchy and better balance visibility.
            </p>
          </div>

          <GlassCard className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">Connected wallet</div>
                <div className="mt-1 font-medium text-primary">GD3...9X2Z</div>
              </div>
            </div>
          </GlassCard>
        </section>

        {notice ? (
          <div className="mb-6 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
            {notice}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <GlassCard className="md:col-span-2 overflow-hidden p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Balance</p>
                <h2 className="section-title text-2xl md:text-3xl">Agent credits available</h2>
              </div>
              <span className="material-symbols-outlined text-accent">token</span>
            </div>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="section-title text-5xl md:text-7xl">{balance?.credits ?? fallbackBalance.credits}</span>
              <span className="text-lg text-on-surface-variant">credits</span>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              {balance ? `Usage: ${balance.usagePercent}% of monthly allocation used.` : "Loading balance..."}
            </p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-secondary" style={{ width: `${usagePercent}%` }} />
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between p-6">
            <div>
              <p className="section-kicker mb-2">Stellar</p>
              <h2 className="section-title text-2xl">XLM balance</h2>
              <p className="mt-4 text-4xl font-semibold text-secondary">{balance?.xlmBalance?.toLocaleString() ?? fallbackBalance.xlmBalance.toLocaleString()}</p>
              <p className="mt-2 text-sm text-on-surface-variant">≈ ${balance?.xlmUsdEstimate?.toFixed(2) ?? fallbackBalance.xlmUsdEstimate.toFixed(2)} USD</p>
            </div>
            <button className="focus-ring mt-8 rounded-full border border-outline-variant/25 px-4 py-3 text-sm font-semibold text-primary transition-all hover:border-accent/30 hover:bg-accent/10">
              Trade XLM
            </button>
          </GlassCard>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="section-kicker mb-2">Refill</p>
            <h2 className="section-title text-2xl md:text-3xl">Credit packages</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} onPurchase={handlePurchase} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Activity</p>
              <h2 className="section-title text-2xl md:text-3xl">Recent transactions</h2>
            </div>
            <span className="text-sm text-on-surface-variant">Latest ledger events</span>
          </div>

          <div className="grid gap-3 md:hidden">
            {transactions.map((tx) => (
              <GlassCard key={`${tx.type}-${tx.txid}`} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] ${tx.typeColor}`}>{tx.type}</span>
                    <div className="mt-3 font-medium text-primary">{tx.description}</div>
                    <div className="mt-1 text-sm text-on-surface-variant">{tx.txid}</div>
                  </div>
                  <div className={`text-sm font-semibold ${tx.amountColor}`}>{tx.amount}</div>
                </div>
                <div className="mt-4 text-sm text-on-surface-variant">{tx.date}</div>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="hidden overflow-hidden md:block" hover={false}>
            <table className="w-full border-collapse text-left">
              <thead className="bg-white/3">
                <tr className="border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Transaction</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {transactions.map((tx) => (
                  <tr key={`${tx.type}-${tx.txid}`} className="transition-colors hover:bg-white/3">
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] ${tx.typeColor}`}>{tx.type}</span>
                    </td>
                    <td className="px-6 py-4 text-primary">{tx.description}</td>
                    <td className="px-6 py-4 font-mono text-sm text-on-surface-variant">{tx.txid}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{tx.date}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${tx.amountColor}`}>{tx.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </section>
      </main>

      <Footer />
    </div>
  );
}
