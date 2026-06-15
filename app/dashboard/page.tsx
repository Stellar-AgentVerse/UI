'use client';

import { useState, useEffect } from "react";
import NavBar from "@/components/agentverse/NavBar";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import { fetchDashboardMetrics, fetchTopAssets, fetchActivityLogs } from "@/lib/api";
import type { DashboardMetrics, TopAsset, ActivityLogItem } from "@/lib/api";

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
  { name: "CyberOracle-v2", category: "Prediction", revenue: "12.5k XLM", calls: "4.8k calls", gradient: "from-secondary/20 to-transparent", assetId: "" },
  { name: "QuantNexus", category: "Finance", revenue: "8.2k XLM", calls: "1.2k calls", gradient: "from-primary/10 to-transparent", assetId: "" },
  { name: "MetaScout-X", category: "Search", revenue: "5.1k XLM", calls: "920 calls", gradient: "from-accent/10 to-transparent", assetId: "" },
];

const systemLogs = [
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

export default function CreatorDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topAssets, setTopAssets] = useState<TopAsset[]>(fallbackTopAssets);
  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  useEffect(() => {
    fetchDashboardMetrics().then(setMetrics).catch(console.error);
    fetchTopAssets().then(setTopAssets).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] overflow-x-hidden">
      <NavBar
        links={[
          { label: "Dashboard", href: "/dashboard", active: true },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Documentation", href: "#" },
        ]}
      />

      {/* Atmospheric background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <main className="pt-24 pb-xl px-md max-w-container-max mx-auto">
        {/* Header */}
        <header className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg mb-xs text-primary">
            Creator Dashboard
          </h1>
          <p className="text-on-surface-variant">
            Manage your autonomous agents and track ecosystem performance.
          </p>
        </header>

        {/* Bento Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
          <GlassCard className="p-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Total Revenue
              </span>
              <span className="material-symbols-outlined text-primary opacity-50">
                payments
              </span>
            </div>
            <div className="flex items-baseline gap-xs">
              <span className="font-headline-md text-headline-md text-primary">
                {metrics ? metrics.totalRevenue.toLocaleString() : "—"}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                XLM
              </span>
            </div>
            <div className="mt-xs text-secondary flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>
              <span className="font-label-sm text-label-sm">
                {metrics ? `+${metrics.revenueTrend}% vs last month` : "—"}
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-9xl">
                currency_exchange
              </span>
            </div>
          </GlassCard>

          <GlassCard className="p-lg">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Assets Published
              </span>
              <span className="material-symbols-outlined text-primary opacity-50">
                token
              </span>
            </div>
            <div className="font-headline-md text-headline-md text-primary">
              {metrics ? metrics.assetsPublished : "—"}
            </div>
            <div className="mt-xs text-on-surface-variant flex items-center gap-xs">
              <span className="font-label-sm text-label-sm">
                {metrics ? `${metrics.pendingVerification} Pending Verification` : "—"}
              </span>
            </div>
          </GlassCard>

          <GlassCard className="p-lg">
            <div className="flex justify-between items-start mb-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Total Executions
              </span>
              <span className="material-symbols-outlined text-primary opacity-50">
                rocket_launch
              </span>
            </div>
            <div className="font-headline-md text-headline-md text-primary">
              {metrics ? metrics.totalExecutions.toLocaleString() : "—"}
            </div>
            <div className="mt-xs text-secondary flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span className="font-label-sm text-label-sm">
                {metrics ? `High Reliability (${metrics.reliability}%)` : "—"}
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Chart + Top Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-lg">
          {/* Revenue Chart */}
          <GlassCard className="lg:col-span-2 p-lg flex flex-col">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="font-headline-md text-headline-md !text-body-lg text-primary">
                Revenue Growth
              </h3>
              <div className="flex gap-base">
                <button className="bg-surface-container text-on-surface-variant px-sm py-xs text-label-sm font-label-sm rounded hover:bg-surface-container-high transition-colors">
                  7D
                </button>
                <button className="bg-primary text-background px-sm py-xs text-label-sm font-label-sm rounded">
                  30D
                </button>
              </div>
            </div>
            <div className="flex-grow min-h-[220px] relative">
              <svg
                className="w-full h-full"
                viewBox="0 0 800 250"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[50, 125, 200].map((y) => (
                  <line
                    key={y}
                    stroke="#8e9192"
                    strokeOpacity="0.1"
                    x1="0"
                    x2="800"
                    y1={y}
                    y2={y}
                  />
                ))}
                {/* Area fill */}
                <path
                  d={`M 0 200 Q ${800 / revenueData.length * 1} 190, ${800 / revenueData.length * 2} 130 T ${800 / revenueData.length * 4} 100 T ${800 / revenueData.length * 6} 40 T 800 20 V 250 H 0 Z`}
                  fill="url(#chartGradient)"
                />
                {/* Line */}
                <path
                  d={`M 0 200 Q ${800 / revenueData.length * 1} 190, ${800 / revenueData.length * 2} 130 T ${800 / revenueData.length * 4} 100 T ${800 / revenueData.length * 6} 40 T 800 20`}
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </GlassCard>

          {/* Top Assets */}
          <GlassCard className="p-lg">
            <h3 className="font-headline-md text-headline-md !text-body-lg text-primary mb-lg">
              Top Assets
            </h3>
            <div className="space-y-md">
              {topAssets.map((asset) => (
                <div
                  key={asset.name}
                  className="flex items-center justify-between p-sm hover:bg-surface-container rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-sm">
                    <div
                      className={`w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden bg-gradient-to-br ${asset.gradient}`}
                    >
                      <span className="material-symbols-outlined text-primary text-lg">
                        smart_toy
                      </span>
                    </div>
                    <div>
                      <div className="font-body-md font-semibold text-primary">
                        {asset.name}
                      </div>
                      <div className="text-label-sm font-label-sm text-on-surface-variant uppercase">
                        {asset.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-body-md text-primary">
                      {asset.revenue}
                    </div>
                    <div className="text-label-sm font-label-sm text-secondary">
                      {asset.calls}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-lg py-sm border border-outline-variant/30 text-on-surface-variant font-body-md hover:bg-surface-container-high transition-colors rounded">
              View All Assets
            </button>
          </GlassCard>
        </div>

        {/* System Logs */}
        <section className="mt-lg">
          <h2 className="font-headline-md text-headline-md !text-body-lg text-primary mb-md">
            System Logs
          </h2>
          <GlassCard className="rounded-xl overflow-hidden" hover={false}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-lg py-sm font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Event
                  </th>
                  <th className="px-lg py-sm font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Asset
                  </th>
                  <th className="px-lg py-sm font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-lg py-sm font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Revenue
                  </th>
                  <th className="px-lg py-sm font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {systemLogs.map((log) => (
                  <tr
                    key={log.event + log.asset}
                    className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                  >
                    <td className="px-lg py-md text-primary">{log.event}</td>
                    <td className="px-lg py-md font-label-sm text-label-sm">
                      {log.asset}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`${log.statusClass} px-xs py-1 rounded text-xs uppercase font-label-sm`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-lg py-md text-primary">{log.revenue}</td>
                    <td className="px-lg py-md text-on-surface-variant">
                      {log.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </section>
      </main>

      <Footer />

      {/* Floating Action Button */}
      <button className="fixed bottom-lg right-lg bg-primary text-background p-md rounded-full shadow-2xl shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-50 h-16 w-16">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
}
