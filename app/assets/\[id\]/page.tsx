'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import NavBar from "@/components/agentverse/NavBar";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import { fetchAsset } from "@/lib/api";
import type { AssetDetail } from "@/lib/api";

export default function AssetDetails() {
  const params = useParams();
  const [asset, setAsset] = useState<AssetDetail | null>(null);

  useEffect(() => {
    const id = params?.id as string;
    if (id) fetchAsset(id).then(setAsset).catch(console.error);
  }, [params?.id]);
  return (
    <div className="min-h-screen bg-[#050816] overflow-x-hidden">
      <NavBar
        links={[
          { label: "Agents", href: "#", active: true },
          { label: "Prompts", href: "#" },
          { label: "Datasets", href: "#" },
          { label: "Workflows", href: "#" },
          { label: "Developers", href: "#" },
        ]}
        rightContent={
          <div className="flex items-center gap-sm">
            <button className="px-md py-xs text-on-surface-variant font-body-md hover:text-primary transition-colors">
              Connect Wallet
            </button>
            <button className="bg-primary text-background px-md py-xs rounded-lg font-body-md font-semibold active:scale-95 transition-transform">
              Launch App
            </button>
          </div>
        }
      />

      {/* Background glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary-container/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-container-max mx-auto px-lg py-xl">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-xl mb-xl">
          {/* Left: Hero Image & Identity */}
          <div className="lg:col-span-7 space-y-lg">
            <div className="relative group aspect-video overflow-hidden rounded-xl glass-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-48 h-48 md:w-64 md:h-64">
                  <div className="absolute inset-0 border border-outline-variant/30 rounded-full animate-spin" style={{ animationDuration: "20s" }} />
                  <div className="absolute inset-4 border border-outline-variant/10 rounded-full animate-spin" style={{ animationDuration: "30s", animationDirection: "reverse" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 md:w-48 md:h-48 glass-card rounded-full flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-7xl md:text-8xl text-primary">
                        psychology
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-md left-md">
                  <span className="inline-flex items-center gap-xs px-sm py-1 bg-primary/10 border border-primary/20 backdrop-blur-md rounded-full text-primary font-label-sm text-label-sm mb-sm">
                    <span className="material-symbols-outlined text-[14px]">
                      auto_awesome
                    </span>
                    {asset?.type ?? "—"}
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">
                    {asset?.name ?? "—"}
                  </h1>
                  <p className="text-on-surface-variant max-w-lg">
                    {asset?.description ?? "—"}
                  </p>
              </div>
            </div>

            {/* Pricing + Execute */}
            <div className="flex items-center justify-between p-lg glass-card rounded-xl">
              <div className="flex flex-col">
                <span className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">
                  Access Price
                </span>
                  <div className="flex items-baseline gap-xs">
                    <span className="font-headline-md text-headline-md text-primary">
                      {asset?.price ?? "—"}
                    </span>
                    <span className="text-on-surface-variant font-body-md">
                      Credits / Run
                    </span>
                  </div>
              </div>
              <button className="bg-primary text-background px-xl py-md rounded-xl font-body-lg font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-sm">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
                Execute Agent
              </button>
            </div>
          </div>

          {/* Right: Metrics + Creator */}
          <div className="lg:col-span-5 space-y-md">
            <div className="grid grid-cols-2 gap-md">
                {(() => {
                  const m = asset?.metrics;
                  const items = [
                    { label: "Executions", value: m ? `${(m.executions / 1000).toFixed(1)}k+` : "—", icon: "bolt" },
                    { label: "Revenue (XLM)", value: m ? `${(m.revenue / 1000).toFixed(1)}k` : "—", icon: "payments" },
                    { label: "Active Users", value: m ? String(m.activeUsers) : "—", icon: "group" },
                    { label: "Rating", value: m ? m.rating.toFixed(2) : "—", icon: "star", filled: true },
                  ];
                  return items.map((metric) => (
                <GlassCard
                  key={metric.label}
                  className="p-md flex flex-col justify-between h-32 group"
                >
                  <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
                    {metric.label}
                    <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">
                      {metric.icon}
                    </span>
                  </span>
                  <span className="font-headline-md text-headline-md text-primary">
                    {metric.value}
                  </span>
                </GlassCard>
              ));
            })()}
            </div>

            {/* Creator Card */}
            <GlassCard className="p-lg space-y-md">
              <div className="flex items-center justify-between">
                <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Architect
                </h3>
                <span className="px-xs py-1 bg-surface-container-high rounded text-[10px] font-label-sm">
                  VERIFIED
                </span>
              </div>
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      person
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-body-lg font-bold text-primary">
                    Etherion Systems
                  </div>
                  <div className="text-on-surface-variant font-label-sm text-label-sm">
                    @etherion_hq
                  </div>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm">
                Specializing in high-frequency data synthesis and autonomous
                reasoning models for the Aetheric network.
              </p>
              <button className="w-full py-sm border border-outline text-primary rounded-lg font-body-md font-semibold hover:bg-primary/5 transition-all">
                Follow Architect
              </button>
            </GlassCard>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="mb-xl">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-headline-md text-headline-md text-primary">
              Agent Capabilities
            </h2>
            <div className="h-px flex-grow mx-lg bg-outline-variant/30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {(asset?.capabilities?.length
              ? asset.capabilities
              : ([] as { icon: string; title: string; description: string; sortOrder: number }[])
            ).map((cap) => (
              <GlassCard
                key={cap.title}
                className="p-lg group hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-md group-hover:bg-primary group-hover:text-background transition-colors">
                  <span className="material-symbols-outlined">{cap.icon}</span>
                </div>
                <h3 className="font-body-lg font-bold text-primary mb-sm">
                  {cap.title}
                </h3>
                <p className="text-on-surface-variant">{cap.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-xl p-xl glass-card rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md text-primary mb-xl text-center">
              Typical Logic Flow
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-lg max-w-4xl mx-auto">
              {[
                { icon: "input", label: "Input Query", active: true },
                { icon: "hub", label: "Neural Analysis", active: false },
                {
                  icon: "article",
                  label: "Strategic Intel",
                  active: true,
                  filled: true,
                },
              ].map((step, i) => (
                <React.Fragment key={step.label}>
                  <div
                    className="flex flex-col items-center gap-sm"
                  >
                    <div
                      className={`w-16 h-16 rounded-full border flex items-center justify-center ${
                        step.filled
                          ? "bg-primary border-primary"
                          : step.active
                            ? "border-primary bg-background"
                            : "border-primary/30 glass-card"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined ${step.filled ? "text-background" : "text-primary"}`}
                      >
                        {step.icon}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block flex-grow h-px bg-outline-variant/30 relative">
                      <div className="absolute -top-1 left-1/2 w-2 h-2 bg-primary rounded-full" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Specs */}
        <section>
          <h3 className="font-headline-md text-headline-md text-primary mb-lg">
            Technical Specifications
          </h3>
          <div className="overflow-hidden border border-outline-variant/30 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container">
                <tr>
                  <th className="p-md text-on-surface-variant font-label-sm text-label-sm uppercase">
                    Parameter
                  </th>
                  <th className="p-md text-on-surface-variant font-label-sm text-label-sm uppercase">
                    Value
                  </th>
                  <th className="p-md text-on-surface-variant font-label-sm text-label-sm uppercase">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {[
                  {
                    param: "Model Architecture",
                    value: "Aether-Core-v7.2",
                    note: "Proprietary logic gate optimization",
                  },
                  {
                    param: "Max Context Window",
                    value: "128k tokens",
                    note: "Optimized for long-form synthesis",
                  },
                  {
                    param: "Data Refresh Rate",
                    value: "Real-time",
                    note: "Websocket stream integration",
                  },
                  {
                    param: "Output Formats",
                    value: "XML, JSON, Markdown",
                    note: "Standardized Aetheric logic schemas",
                  },
                ].map((row) => (
                  <tr
                    key={row.param}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-md font-bold text-primary">{row.param}</td>
                    <td className="p-md font-label-sm text-on-secondary-container">
                      {row.value}
                    </td>
                    <td className="p-md text-on-surface-variant">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer
        columns={[
          {
            title: "Resources",
            links: [
              { label: "Documentation", href: "#" },
              { label: "Network Status", href: "#" },
              { label: "Github", href: "#" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
              { label: "Discord", href: "#" },
            ],
          },
        ]}
      />
    </div>
  );
}
