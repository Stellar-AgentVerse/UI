'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import NavBar from '@/components/agentverse/NavBar';
import Footer from '@/components/agentverse/Footer';
import GlassCard from '@/components/agentverse/GlassCard';
import { SessionNotice, WalletBar } from '@/components/market/WalletBar';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/market/primitives';
import { toServerFailure } from '@/lib/api';
import { useMarketSession } from '@/lib/market/session';
import { useActivityLogs, useDashboardMetrics, useTopAssets } from '@/lib/queries';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Dashboard', href: '/dashboard', active: true },
];

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint: ReactNode;
}) {
  return (
    <GlassCard className="relative overflow-hidden p-6" hover={false}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <p className="section-kicker mb-3">{label}</p>
      <p className="section-title text-3xl md:text-[2.6rem]">{value}</p>
      <p className="mt-3 text-sm text-on-surface-variant">{hint}</p>
    </GlassCard>
  );
}

export default function CreatorDashboard() {
  const session = useMarketSession();
  const creator = session.wallet?.address;
  const metricsQuery = useDashboardMetrics(creator);
  const topAssetsQuery = useTopAssets(creator);
  const activityLogsQuery = useActivityLogs(creator);
  const metrics = metricsQuery.data;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar links={NAV_LINKS} rightContent={<WalletBar />} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute right-[5%] top-[16%] h-[22rem] w-[22rem] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="section-kicker">Overview</p>
            <h1 className="section-title text-4xl md:text-5xl">Creator dashboard</h1>
            <p className="section-copy max-w-2xl">
              Revenue, executions and activity as recorded by the marketplace. Every figure here is
              read from the API; when it is unavailable this page says so rather than showing a
              placeholder.
            </p>
          </div>
          <Link href="/publish" className="market-button-primary">
            Publish an asset
          </Link>
        </header>

        <div className="mb-6 space-y-4">
          <SessionNotice />
        </div>

        <section aria-labelledby="metrics-heading" className="space-y-4">
          <h2 id="metrics-heading" className="sr-only">
            Headline metrics
          </h2>
          {metricsQuery.isError ? (
            <ErrorState
              title="Dashboard metrics unavailable"
              message={toServerFailure(metricsQuery.error).message}
              requestId={toServerFailure(metricsQuery.error).requestId}
              onRetry={() => metricsQuery.refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard
                label="Total revenue"
                value={metrics ? metrics.totalRevenue.toLocaleString() : '—'}
                hint={
                  metrics
                    ? `${metrics.revenueTrend}% versus last month`
                    : 'Waiting for the marketplace'
                }
              />
              <MetricCard
                label="Assets published"
                value={metrics ? metrics.assetsPublished : '—'}
                hint={
                  metrics
                    ? `${metrics.pendingVerification} pending verification`
                    : 'Waiting for the marketplace'
                }
              />
              <MetricCard
                label="Total executions"
                value={metrics ? metrics.totalExecutions.toLocaleString() : '—'}
                hint={
                  metrics ? `Reliability ${metrics.reliability}%` : 'Waiting for the marketplace'
                }
              />
            </div>
          )}
        </section>

        <section aria-labelledby="top-assets-heading" className="mt-10 space-y-4">
          <h2 id="top-assets-heading" className="section-title text-2xl md:text-3xl">
            Top assets
          </h2>
          {topAssetsQuery.isPending ? (
            <CardSkeleton />
          ) : topAssetsQuery.isError ? (
            <ErrorState
              title="Top assets unavailable"
              message={toServerFailure(topAssetsQuery.error).message}
              onRetry={() => topAssetsQuery.refetch()}
            />
          ) : (topAssetsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No assets recorded yet"
              description="The marketplace has no ranked assets for this account."
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(topAssetsQuery.data ?? []).map((asset) => (
                <li key={`${asset.name}-${asset.assetId}`}>
                  <GlassCard className="p-4" hover={false}>
                    <p className="font-semibold text-primary">{asset.name}</p>
                    <p className="text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
                      {asset.category}
                    </p>
                    <p className="mt-3 text-sm text-on-surface">{asset.revenue}</p>
                    <p className="text-sm text-on-surface-variant">{asset.calls}</p>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="activity-heading" className="mt-10 space-y-4">
          <h2 id="activity-heading" className="section-title text-2xl md:text-3xl">
            Activity
          </h2>
          {activityLogsQuery.isPending ? (
            <CardSkeleton />
          ) : activityLogsQuery.isError ? (
            <ErrorState
              title="Activity log unavailable"
              message={toServerFailure(activityLogsQuery.error).message}
              onRetry={() => activityLogsQuery.refetch()}
            />
          ) : (activityLogsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No recorded activity"
              description="The marketplace has no activity entries for this account."
            />
          ) : (
            <GlassCard className="overflow-x-auto" hover={false}>
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <caption className="sr-only">Recent marketplace activity</caption>
                <thead className="bg-white/3">
                  <tr className="border-b border-outline-variant/10">
                    <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Event</th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Asset</th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Status</th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Revenue</th>
                    <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {(activityLogsQuery.data ?? []).map((log) => (
                    <tr key={`${log.event}-${log.asset}-${log.time}`}>
                      <td className="px-6 py-4 text-primary">{log.event}</td>
                      <td className="px-6 py-4 font-label text-sm text-on-surface-variant">{log.asset}</td>
                      <td className="px-6 py-4 text-on-surface">{log.status}</td>
                      <td className="px-6 py-4 text-primary">{log.revenue}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
