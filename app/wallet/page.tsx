'use client';

import { useState, useEffect } from "react";
import GlassCard from "@/components/agentverse/GlassCard";
import NavBar from "@/components/agentverse/NavBar";
import Footer from "@/components/agentverse/Footer";
import { fetchWalletBalance, fetchCreditPackages, fetchWalletTransactions, purchasePackage } from "@/lib/api";
import type { WalletBalance, CreditPackage, WalletTransaction } from "@/lib/api";

const fallbackPackages: CreditPackage[] = [
  { id: "1", name: "Starter", slug: "starter", description: "Perfect for individual developers and testing.", icon: "rocket_launch", credits: 500, price: 50, originalPrice: null, features: ["Standard Execution Speed", "Basic Agent Monitoring"], popular: false },
  { id: "2", name: "Pro", slug: "pro", description: "For growing agents that need consistent power.", icon: "workspace_premium", credits: 2500, price: 200, originalPrice: 250, features: ["Priority Execution", "Advanced Analytics Suite", "API Sandbox Access"], popular: true },
  { id: "3", name: "Enterprise", slug: "enterprise", description: "Massive scale for high-volume workflows.", icon: "corporate_fare", credits: 10000, price: 800, originalPrice: null, features: ["Ultra-low Latency Node", "Unlimited Agent Deployments", "24/7 Priority Support"], popular: false },
];

type DisplayTx = {
  type: string; typeColor: string; description: string; txid: string; date: string; amount: string; amountColor: string;
};

const fallbackTransactions: DisplayTx[] = [
  { type: "Purchase", typeColor: "bg-error", description: "Marketplace: Data Aggregator V2", txid: "0x82f...e31", date: "Oct 24, 2023", amount: "-120 Credits", amountColor: "text-error" },
  { type: "Income", typeColor: "bg-secondary", description: "Agent Revenue: Neural-Search-Bot", txid: "0x41a...b2c", date: "Oct 23, 2023", amount: "+45.50 Credits", amountColor: "text-secondary" },
  { type: "Fee", typeColor: "bg-outline", description: "Network Maintenance Fee", txid: "0x111...789", date: "Oct 22, 2023", amount: "-0.50 Credits", amountColor: "text-outline-variant" },
  { type: "Refill", typeColor: "bg-primary", description: "Resource Refill: Starter Pack", txid: "0x902...a4e", date: "Oct 20, 2023", amount: "+500 Credits", amountColor: "text-primary" },
];

function toDisplayTx(tx: WalletTransaction): DisplayTx {
  const typeConfig: Record<string, { color: string; icon: string }> = {
    PURCHASE: { color: "bg-error", icon: "shopping_cart" },
    INCOME: { color: "bg-secondary", icon: "trending_up" },
    FEE: { color: "bg-outline", icon: "bolt" },
    REFILL: { color: "bg-primary", icon: "add_card" },
  };
  const cfg = typeConfig[tx.type] ?? { color: "bg-outline", icon: "receipt" };
  const isPositive = tx.amount >= 0;
  return {
    type: tx.type,
    typeColor: cfg.color,
    description: tx.description,
    txid: tx.txid,
    date: new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    amount: `${isPositive ? "+" : ""}${tx.amount.toLocaleString()} ${tx.currency}`,
    amountColor: isPositive ? "text-secondary" : "text-error",
  };
}

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>(fallbackPackages);
  const [transactions, setTransactions] = useState<DisplayTx[]>(fallbackTransactions);

  useEffect(() => {
    fetchWalletBalance().then(setBalance).catch(console.error);
    fetchCreditPackages().then(setPackages).catch(console.error);
    fetchWalletTransactions().then((apiTxs) => setTransactions(apiTxs.map(toDisplayTx))).catch(console.error);
  }, []);

  const handlePurchase = async (packageId: string) => {
    try {
      const result = await purchasePackage(packageId);
      alert(result.message);
      fetchWalletBalance().then(setBalance).catch(console.error);
      fetchWalletTransactions().then((apiTxs) => setTransactions(apiTxs.map(toDisplayTx))).catch(console.error);
    } catch (err) {
      alert(`Purchase failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816]">
      <NavBar
        links={[
          { label: "Marketplace", href: "#" },
          { label: "Agents", href: "#" },
          { label: "Wallet", href: "/wallet", active: true },
          { label: "Docs", href: "#" },
        ]}
      />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative w-full py-xl overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/3 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-container-max mx-auto px-md">
            <div className="flex flex-col md:flex-row items-end justify-between gap-md mb-lg">
              <div>
                <h1 className="font-display-xl text-display-xl tracking-tight text-primary mb-xs">
                  Wallet
                </h1>
                <p className="text-on-surface-variant font-body-lg max-w-xl">
                  Manage your computational power and agent resources through the
                  Stellar network.
                </p>
              </div>

              {/* Connected Wallet */}
              <GlassCard className="p-md rounded-xl flex items-center gap-md border-primary/20">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    wallet
                  </span>
                </div>
                <div>
                  <p className="text-on-surface-variant font-label-sm mb-1 uppercase tracking-widest">
                    Connected Wallet
                  </p>
                  <p className="font-label-sm text-primary">
                    GD3...9X2Z{" "}
                    <span className="text-on-tertiary-container ml-2 cursor-pointer hover:text-primary transition-colors">
                      content_copy
                    </span>
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {/* Credit Balance */}
              <GlassCard className="p-lg rounded-xl col-span-1 md:col-span-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      token
                    </span>
                    <span className="text-on-surface-variant font-label-sm">AGENT CREDITS</span>
                  </div>
                  <div className="flex items-baseline gap-sm">
                    <span className="font-display-xl text-display-xl text-primary">{balance?.credits ?? "—"}</span>
                    <span className="text-on-surface-variant font-headline-md font-normal">Credits Available</span>
                  </div>
                  <div className="mt-lg flex gap-md">
                    <div className="h-1 bg-primary/20 flex-grow rounded-full overflow-hidden">
                      <div className="h-full bg-primary shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full" style={{ width: `${balance?.usagePercent ?? 0}%` }} />
                    </div>
                  </div>
                  <p className="mt-sm text-on-surface-variant font-label-sm">
                    {balance ? `Usage: ${balance.usagePercent}% of monthly allocation used.` : "—"}
                  </p>
                </div>
              </GlassCard>

              {/* XLM Balance */}
              <GlassCard className="p-lg rounded-xl flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      currency_exchange
                    </span>
                    <span className="text-on-surface-variant font-label-sm uppercase">Stellar XLM</span>
                  </div>
                  <p className="font-headline-lg text-headline-lg text-secondary">{balance?.xlmBalance?.toLocaleString() ?? "—"}</p>
                  <p className="text-on-tertiary-container font-label-sm mt-xs">
                    ≈ ${balance?.xlmUsdEstimate?.toFixed(2) ?? "—"} USD
                  </p>
                </div>
                <button className="mt-lg border border-outline-variant hover:border-primary text-primary py-base px-md rounded-lg font-label-sm transition-all duration-300 text-center active:scale-[0.98]">
                  Trade XLM
                </button>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Buy Credits Section */}
        <section className="py-xl bg-surface-container-lowest/50">
          <div className="max-w-container-max mx-auto px-md">
            <div className="mb-lg">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">
                Refill Resources
              </h2>
              <p className="text-on-surface-variant font-body-md">
                Scale your operations instantly with tiered credit packages.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`glass-card p-lg rounded-xl flex flex-col justify-between transition-all duration-500 group ${
                    pkg.popular
                      ? "border-primary/40 shadow-2xl scale-105 relative overflow-hidden z-10"
                      : "hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%),rgba(20,19,19,0.7)]"
                  }`}
                >
                  {pkg.popular && (
                    <>
                      <div className="absolute top-0 right-0 bg-primary text-background px-md py-xs font-label-sm rounded-bl-lg z-20">
                        POPULAR
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    </>
                  )}
                  <div>
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-md transition-colors duration-500 ${
                        pkg.popular
                          ? "bg-primary text-background"
                          : "bg-surface-container group-hover:bg-primary group-hover:text-background"
                      }`}
                    >
                      <span className="material-symbols-outlined">{pkg.icon}</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-xs">
                      {pkg.name}
                    </h3>
                    <p className="text-on-surface-variant font-body-md mb-lg">
                      {pkg.description}
                    </p>
                    <div className="space-y-sm mb-xl">
                      {(pkg.features ?? []).map((f) => (
                        <div key={f} className="flex items-center gap-sm">
                          <span className="material-symbols-outlined text-primary text-[18px]">
                            check_circle
                          </span>
                          <span className="text-on-surface text-body-md">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-sm">
                    <div className="flex items-baseline gap-xs mb-sm">
                      <span className="font-headline-md text-headline-md text-primary">
                        {pkg.credits?.toLocaleString() ?? "—"}
                      </span>
                      <span className="text-body-md text-on-surface-variant">Credits</span>
                    </div>
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      className={`w-full py-md font-bold transition-all duration-300 rounded-lg active:scale-[0.98] ${
                        pkg.popular
                          ? "bg-primary text-background shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                          : "bg-surface-container hover:bg-primary hover:text-background text-primary"
                      }`}
                    >
                      Buy for {pkg.price} XLM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transaction History */}
        <section className="py-xl">
          <div className="max-w-container-max mx-auto px-md">
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-headline-md text-headline-md text-primary">
                Recent Transactions
              </h2>
              <button className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-sm">
                VIEW ALL{" "}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <GlassCard className="rounded-xl overflow-hidden divide-y divide-outline-variant/10" hover={false}>
              {transactions.map((tx) => (
                <div
                  key={tx.txid}
                  className="p-md flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-md">
                    <div className={`w-12 h-12 rounded-lg ${tx.typeColor}/10 flex items-center justify-center ${tx.amountColor}`}>
                      <span className="material-symbols-outlined">
                        {tx.type === "Purchase" ? "shopping_cart" : tx.type === "Income" ? "trending_up" : tx.type === "Fee" ? "bolt" : "add_card"}
                      </span>
                    </div>
                    <div>
                      <p className="text-primary font-body-md font-medium">{tx.description}</p>
                      <p className="text-on-tertiary-container font-label-sm">{tx.txid}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-label-sm font-bold ${tx.amountColor}`}>{tx.amount}</p>
                    <p className="text-on-tertiary-container font-label-sm">{tx.date}</p>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        </section>
      </main>

      <Footer
        columns={[
          {
            title: "Platform",
            links: [
              { label: "Marketplace", href: "#" },
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
        ]}
      />
    </div>
  );
}
