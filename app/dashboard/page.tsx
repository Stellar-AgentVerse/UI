'use client';

import { useEffect, useMemo, useState, type ReactNode } from "react";
import NavBar from "@/components/agentverse/NavBar";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import { fetchActivityLogs, fetchDashboardMetrics, fetchTopAssets } from "@/lib/api";
import type { ActivityLogItem, DashboardMetrics, TopAsset } from "@/lib/api";

const revenueData = [
  { day: "Mon", value: 40 },
  { day: "Tue", value: 55 },
  { day: "Wed", value: 30 },
  { day: "Thu", value: 65 },
  { day: "Fri", value: 48 },
  { day: "Sat", value: 72 },
  { day: "Sun", value: 60 },
];

const fallbackTopAssets: TopAsset[] = [
  {
    name: "CyberOracle-v2",
    category: "Prediction",
    revenue: "12.5k XLM",
    calls: "4.8k calls",
    gradient: "from-secondary/20 to-transparent",
    assetId: "",
  },
  {
    name: "QuantNexus",
    category: "Finance",
    revenue: "8.2k XLM",
    calls: "1.2k calls",
    gradient: "from-primary/10 to-transparent",
    assetId: "",
  },
  {
    name: "MetaScout-X",
    category: "Search",
    revenue: "5.1k XLM",
    calls: "920 calls",
    gradient: "from-accent/10 to-transparent",
    assetId: "",
  },
];

const fallbackLogs: ActivityLogItem[] = [
  {
    event: "Execution Success",
    asset: "CYBERORACLE-V2",
    status: "Active",
    statusClass: "text-secondary bg-secondary/10",
    revenue: "+0.25 XLM",
    time: "2 mins ago",
  },
  {
    event: "New Subscription",
    asset: "QUANTNEXUS",
    status: "Active",
    statusClass: "text-secondary bg-secondary/10",
    revenue: "+500.00 XLM",
    time: "14 mins ago",
  },
  {
    event: "API Heartbeat",
    asset: "METASCOUT-X",
    status: "Idle",
    statusClass: "text-on-surface-variant bg-surface-variant",
    revenue: "--",
    time: "1 hr ago",
  },
];

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint: ReactNode;
  icon: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">{label}</p>
          <div className="flex items-end gap-2">
            <span className="section-title text-3xl md:text-[2.6rem]">{value}</span>
          </div>
          <p className="mt-3 text-sm text-on-surface-variant">{hint}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/20 bg-white/5 text-accent">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </GlassCard>
  );
}

export default function CreatorDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topAssets, setTopAssets] = useState<TopAsset[]>(fallbackTopAssets);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(fallbackLogs);

  useEffect(() => {
    fetchDashboardMetrics().then(setMetrics).catch(console.error);
    fetchTopAssets().then(setTopAssets).catch(console.error);
    fetchActivityLogs().then(setActivityLogs).catch(console.error);
  }, []);

  const revenueSeries = useMemo(() => revenueData.map((point) => point.value), []);
  const maxRevenue = Math.max(...revenueSeries);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar
        links={[
          { label: "Dashboard", href: "/dashboard", active: true },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Wallet", href: "/wallet" },
        ]}
        rightContent={
          <div className="flex items-center gap-3">
            <button className="focus-ring rounded-full border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:border-accent/40 hover:text-primary">
              Live Mode
            </button>
            <button className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">
              Launch App
            </button>
          </div>
        }
      />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute left-[8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute right-[5%] top-[16%] h-[22rem] w-[22rem] rounded-full bg-secondary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[18rem] w-[18rem] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="section-kicker">Overview</p>
            <h1 className="section-title text-4xl md:text-6xl">Creator Dashboard</h1>
            <p className="section-copy max-w-2xl">
              Monitor revenue, executions, and asset performance with a premium control surface built for serious operators.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="focus-ring rounded-full border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:border-accent/40 hover:text-primary">
              Export report
            </button>
            <button className="focus-ring rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:brightness-110 active:scale-95">
              Publish asset
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Total revenue"
            value={metrics ? metrics.totalRevenue.toLocaleString() : "—"}
            hint={metrics ? `${metrics.revenueTrend}% vs last month` : "Loading monthly performance"}
            icon="payments"
          />
          <MetricCard
            label="Assets published"
            value={metrics ? metrics.assetsPublished : "—"}
            hint={metrics ? `${metrics.pendingVerification} pending verification` : "Waiting for live data"}
            icon="token"
          />
          <MetricCard
            label="Total executions"
            value={metrics ? metrics.totalExecutions.toLocaleString() : "—"}
            hint={metrics ? `Reliability ${metrics.reliability}%` : "Tracking network activity"}
            icon="rocket_launch"
          />
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <GlassCard className="xl:col-span-2 p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Performance</p>
                <h2 className="section-title text-2xl md:text-3xl">Revenue Growth</h2>
              </div>
              <div className="flex rounded-full border border-outline-variant/20 bg-surface-container-low/70 p-1">
                {['7D', '30D'].map((range, index) => (
                  <button
                    key={range}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      index === 1 ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-4">
              <svg className="h-[280px] w-full" viewBox="0 0 800 280" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5ffbf1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#5ffbf1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[60, 140, 220].map((y) => (
                  <line key={y} stroke="#7f8db0" strokeOpacity="0.12" x1="0" x2="800" y1={y} y2={y} />
                ))}
                <path
                  d={`M 0 220 Q 100 210, 133 160 T 266 145 T 399 110 T 532 90 T 665 45 T 800 60 V 280 H 0 Z`}
                  fill="url(#chartGradient)"
                />
                <path
                  d={`M 0 220 Q 100 210, 133 160 T 266 145 T 399 110 T 532 90 T 665 45 T 800 60`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {revenueData.map((point, index) => {
                  const x = 60 + (index * 110);
                  const y = 220 - ((point.value / maxRevenue) * 170);
                  return (
                    <g key={point.day}>
                      <circle cx={x} cy={y} r="5" fill="#5ffbf1" />
                      <text x={x} y="256" textAnchor="middle" fill="#b5bfd9" fontSize="12">{point.day}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="section-kicker mb-2">Assets</p>
                <h2 className="section-title text-2xl">Top assets</h2>
              </div>
              <span className="material-symbols-outlined text-accent">auto_graph</span>
            </div>

            <div className="space-y-3">
              {topAssets.map((asset) => (
                <div key={asset.name} className="rounded-2xl border border-outline-variant/15 bg-white/3 p-4 transition-colors hover:border-accent/25 hover:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${asset.gradient} border border-outline-variant/10`}>
                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{asset.name}</div>
                        <div className="text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">{asset.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{asset.revenue}</div>
                      <div className="text-sm text-on-surface-variant">{asset.calls}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="focus-ring mt-6 w-full rounded-full border border-outline-variant/25 px-4 py-3 text-sm font-medium text-on-surface-variant transition-all hover:border-accent/30 hover:text-primary">
              View all assets
            </button>
          </GlassCard>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Activity</p>
              <h2 className="section-title text-2xl md:text-3xl">System logs</h2>
            </div>
            <span className="text-sm text-on-surface-variant">Last 24 hours</span>
          </div>

          <div className="grid gap-3 md:hidden">
            {activityLogs.map((log) => (
              <GlassCard key={`${log.event}-${log.asset}`} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-primary">{log.event}</div>
                    <div className="mt-1 text-sm text-on-surface-variant">{log.asset}</div>
                  </div>
                  <span className={`${log.statusClass} rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em]`}>
                    {log.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-primary">{log.revenue}</span>
                  <span className="text-on-surface-variant">{log.time}</span>
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="hidden overflow-hidden md:block" hover={false}>
            <table className="w-full border-collapse text-left">
              <thead className="bg-white/3">
                <tr className="border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Event</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Asset</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Revenue</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {activityLogs.map((log) => (
                  <tr key={`${log.event}-${log.asset}`} className="transition-colors hover:bg-white/3">
                    <td className="px-6 py-4 text-primary">{log.event}</td>
                    <td className="px-6 py-4 font-mono text-sm tracking-[0.12em] text-on-surface-variant">{log.asset}</td>
                    <td className="px-6 py-4">
                      <span className={`${log.statusClass} rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em]`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-primary">{log.revenue}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </section>
      </main>

      <Footer />

      <button className="focus-ring fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_18px_50px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:scale-95">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
}
