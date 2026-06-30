'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import NavBar from "@/components/agentverse/NavBar";
import { fetchAsset } from "@/lib/api";
import type { AssetDetail } from "@/lib/api";

function MetricTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{label}</div>
          <div className="mt-3 text-2xl font-semibold text-primary">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/20 bg-white/5 text-accent">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </GlassCard>
  );
}

export default function AssetDetails() {
  const params = useParams();
  const [asset, setAsset] = useState<AssetDetail | null>(null);

  useEffect(() => {
    const id = params?.id as string;
    if (id) fetchAsset(id).then(setAsset).catch(console.error);
  }, [params?.id]);

  const metrics = useMemo(() => asset?.metrics, [asset]);
  const workflow = asset?.workflow ?? [];
  const specs = asset?.specs ?? [];
  const capabilities = asset?.capabilities ?? [];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar
        links={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Wallet", href: "/wallet" },
        ]}
        rightContent={
          <div className="flex items-center gap-3">
            <button className="focus-ring rounded-full border border-outline-variant/25 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-primary">
              Connect wallet
            </button>
            <button className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">
              Launch App
            </button>
          </div>
        }
      />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute right-[-8%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute left-[-8%] bottom-[-10%] h-[24rem] w-[24rem] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <GlassCard className="relative overflow-hidden p-0">
            <div className="relative min-h-[32rem] overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,251,241,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]" />
              <div className="absolute inset-0 opacity-80">
                <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-outline-variant/20" />
                <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-outline-variant/10" />
                <div className="absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/20 bg-background/60 backdrop-blur-md">
                  <span className="material-symbols-outlined text-7xl text-primary">psychology</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent p-6 md:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  {asset?.type ?? "Loading"}
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-primary md:text-6xl">{asset?.name ?? "—"}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                  {asset?.description ?? "—"}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {(asset?.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-full border border-outline-variant/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-kicker mb-2">Access</p>
                  <h2 className="section-title text-2xl">Pricing and execution</h2>
                </div>
                <span className="material-symbols-outlined text-accent">payments</span>
              </div>

              <div className="mt-6 flex items-end gap-3">
                <div className="text-5xl font-semibold text-primary">{asset?.price ?? "—"}</div>
                <div className="pb-1 text-sm text-on-surface-variant">credits / run</div>
              </div>

              <button className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Execute asset
              </button>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <MetricTile label="Executions" value={metrics ? metrics.executions.toLocaleString() : "—"} icon="bolt" />
              <MetricTile label="Revenue" value={metrics ? `${metrics.revenue.toLocaleString()} XLM` : "—"} icon="payments" />
              <MetricTile label="Active users" value={metrics ? metrics.activeUsers.toLocaleString() : "—"} icon="group" />
              <MetricTile label="Rating" value={metrics ? metrics.rating.toFixed(2) : "—"} icon="star" />
            </div>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-kicker mb-2">Architect</p>
                  <h2 className="section-title text-2xl">Etherion Systems</h2>
                </div>
                <span className="rounded-full border border-outline-variant/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  Verified
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                Specializing in high-frequency data synthesis and autonomous reasoning models for the Aetheric network.
              </p>
              <button className="focus-ring mt-6 rounded-full border border-outline-variant/25 px-4 py-3 text-sm font-semibold text-primary transition-all hover:border-accent/30 hover:bg-accent/10">
                Follow architect
              </button>
            </GlassCard>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Capabilities</p>
                <h2 className="section-title text-2xl md:text-3xl">What it does</h2>
              </div>
              <span className="text-sm text-on-surface-variant">{capabilities.length} capabilities</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {capabilities.length
                ? capabilities.map((cap) => (
                    <div key={cap.title} className="rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <span className="material-symbols-outlined">{cap.icon}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-primary">{cap.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{cap.description}</p>
                    </div>
                  ))
                : <p className="text-sm text-on-surface-variant">No capabilities available yet.</p>}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Workflow</p>
                <h2 className="section-title text-2xl md:text-3xl">Typical logic flow</h2>
              </div>
              <span className="text-sm text-on-surface-variant">{workflow.length} steps</span>
            </div>
            <div className="space-y-4">
              {workflow.length
                ? workflow.map((step, index) => (
                    <div key={step.label} className="flex items-center gap-4 rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${step.isFilled ? "border-accent/30 bg-accent text-on-primary" : step.isActive ? "border-accent/30 bg-accent/10 text-accent" : "border-outline-variant/20 bg-white/5 text-on-surface-variant"}`}>
                        <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-primary">{step.label}</div>
                        <div className="text-sm text-on-surface-variant">Step {index + 1}</div>
                      </div>
                    </div>
                  ))
                : <p className="text-sm text-on-surface-variant">Workflow not available yet.</p>}
            </div>
          </GlassCard>
        </section>

        <section className="mt-10 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <GlassCard className="p-6">
            <div className="mb-6">
              <p className="section-kicker mb-2">Technical details</p>
              <h2 className="section-title text-2xl md:text-3xl">Specifications</h2>
            </div>
            <div className="space-y-3">
              {specs.length
                ? specs.map((spec) => (
                    <div key={spec.parameter} className="flex items-start justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
                      <div>
                        <div className="text-sm uppercase tracking-[0.18em] text-on-surface-variant">{spec.parameter}</div>
                        <div className="mt-1 font-medium text-primary">{spec.value}</div>
                      </div>
                      <div className="max-w-[45%] text-right text-sm text-on-surface-variant">{spec.notes}</div>
                    </div>
                  ))
                : <p className="text-sm text-on-surface-variant">No specifications available yet.</p>}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Trust</p>
                <h2 className="section-title text-2xl md:text-3xl">Creator profile</h2>
              </div>
              <span className="material-symbols-outlined text-accent">verified</span>
            </div>
            <div className="rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
                  <span className="material-symbols-outlined text-[28px]">person</span>
                </div>
                <div>
                  <div className="text-xl font-semibold text-primary">Etherion Systems</div>
                  <div className="text-sm text-on-surface-variant">@etherion_hq</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                Specializing in high-frequency data synthesis and autonomous reasoning models for the Aetheric network.
              </p>
            </div>
          </GlassCard>
        </section>
      </main>

      <Footer />
    </div>
  );
}
