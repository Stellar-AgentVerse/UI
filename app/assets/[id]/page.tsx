'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Footer from '@/components/agentverse/Footer';
import GlassCard from '@/components/agentverse/GlassCard';
import NavBar from '@/components/agentverse/NavBar';
import { SessionNotice, WalletBar } from '@/components/market/WalletBar';
import { PurchasePanel } from '@/components/market/PurchasePanel';
import { Callout, CardSkeleton, ErrorState } from '@/components/market/primitives';
import { ArrowRightIcon, PromptIcon } from '@/components/market/icons';
import { toServerFailure } from '@/lib/api';
import { assetTypeLabel, isMarketV1AssetType } from '@/lib/market/scope';
import { useAsset } from '@/lib/queries';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace', active: true },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Dashboard', href: '/dashboard' },
];

export default function AssetDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : undefined;
  const assetQuery = useAsset(id);
  const asset = assetQuery.data;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar links={NAV_LINKS} rightContent={<WalletBar />} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute right-[-8%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-[24rem] w-[24rem] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <Link
          href="/marketplace"
          className="focus-ring mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-full text-sm font-medium text-accent"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          Back to the catalog
        </Link>

        <div className="mb-6 space-y-4">
          <SessionNotice />
        </div>

        {assetQuery.isPending ? (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : assetQuery.isError ? (
          <ErrorState
            title="This prompt could not be loaded"
            message={toServerFailure(assetQuery.error).message}
            requestId={toServerFailure(assetQuery.error).requestId}
            onRetry={() => assetQuery.refetch()}
          />
        ) : !asset ? (
          <ErrorState
            title="This prompt could not be loaded"
            message="The marketplace answered successfully but returned no asset for this address."
          />
        ) : !isMarketV1AssetType(asset.type) ? (
          <UnsupportedAsset type={asset.type} name={asset.name} />
        ) : asset.status !== 'PUBLISHED' ? (
          <UnpublishedAsset status={asset.status} name={asset.name} />
        ) : (
          <PromptDetail asset={asset} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function UnsupportedAsset({ type, name }: { type: string; name: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="section-title text-3xl md:text-4xl">{name}</h1>
      <Callout tone="warning" title={`${assetTypeLabel(type)} assets are not part of Market V1`}>
        <p>
          Market V1 sells curated prompts only. This {assetTypeLabel(type).toLowerCase()} exists in
          the catalog, but there is no purchase or delivery path for it yet, so it cannot be bought
          here and is not offered for sale anywhere in the app.
        </p>
      </Callout>
      <Link href="/marketplace" className="market-button-primary">
        Browse the prompt catalog
      </Link>
    </div>
  );
}

/**
 * The marketplace refuses to quote anything that is not published, so offering
 * a Buy button here would only produce a 400 after the buyer has committed.
 */
function UnpublishedAsset({ status, name }: { status: string; name: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="section-title text-3xl md:text-4xl">{name}</h1>
      <Callout tone="warning" title="This prompt is not on sale">
        <p>
          The marketplace lists it as {status.toLowerCase()} rather than published, and it will not
          quote a purchase for it. It may become available later.
        </p>
      </Callout>
      <Link href="/marketplace" className="market-button-primary">
        Browse the prompt catalog
      </Link>
    </div>
  );
}

function PromptDetail({ asset }: { asset: NonNullable<ReturnType<typeof useAsset>['data']> }) {
  const capabilities = asset.capabilities ?? [];
  const specs = asset.specs ?? [];
  const metrics = asset.metrics;
  const tags = asset.tags ?? [];

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent">
          <PromptIcon className="h-3.5 w-3.5" />
          Prompt
        </span>
        <h1 className="section-title text-4xl md:text-5xl">{asset.name}</h1>
        <p className="section-copy">
          {asset.description?.trim() || 'This prompt has no description yet.'}
        </p>
        {tags.length ? (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-outline-variant/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="font-heading text-xl font-semibold text-primary">Publisher</h2>
            <p className="mt-3 text-sm text-on-surface-variant">
              Published by the Stellar account below. The marketplace does not verify publisher
              identities, so treat the account itself as the identity.
            </p>
            <p className="mt-3 break-all font-label text-sm text-on-surface">
              {asset.creatorPublicKey}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                  First published
                </dt>
                <dd className="mt-1 text-sm text-on-surface">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                  Catalog status
                </dt>
                <dd className="mt-1 text-sm text-on-surface">{asset.status}</dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="font-heading text-xl font-semibold text-primary">Recorded activity</h2>
            {metrics ? (
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <Metric
                  label="Executions"
                  value={metrics.executions > 0 ? metrics.executions.toLocaleString() : 'None yet'}
                />
                <Metric
                  label="Buyers"
                  value={metrics.activeUsers > 0 ? metrics.activeUsers.toLocaleString() : 'None yet'}
                />
                <Metric
                  label="Rating"
                  value={metrics.rating > 0 ? `${metrics.rating.toFixed(2)} / 5` : 'Not rated yet'}
                />
                <Metric
                  label="Revenue"
                  value={metrics.revenue > 0 ? metrics.revenue.toLocaleString() : 'None yet'}
                />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-on-surface-variant">
                The marketplace has no recorded activity for this prompt.
              </p>
            )}
          </GlassCard>

          {capabilities.length ? (
            <GlassCard className="p-6">
              <h2 className="font-heading text-xl font-semibold text-primary">What it does</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {capabilities.map((capability) => (
                  <li
                    key={capability.title}
                    className="rounded-2xl border border-outline-variant/15 bg-white/4 p-4"
                  >
                    <h3 className="font-medium text-primary">{capability.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {capability.description}
                    </p>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          {specs.length ? (
            <GlassCard className="p-6">
              <h2 className="font-heading text-xl font-semibold text-primary">Specifications</h2>
              <dl className="mt-4 space-y-3">
                {specs.map((spec) => (
                  <div
                    key={spec.parameter}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-outline-variant/15 bg-white/4 p-4"
                  >
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                        {spec.parameter}
                      </dt>
                      <dd className="mt-1 font-medium text-primary">{spec.value}</dd>
                    </div>
                    {spec.notes ? (
                      <p className="max-w-[45%] text-sm text-on-surface-variant">{spec.notes}</p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </GlassCard>
          ) : null}
        </div>

        <GlassCard className="p-6 lg:sticky lg:top-28" hover={false}>
          <PurchasePanel asset={asset} />
        </GlassCard>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-white/4 p-4">
      <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-primary">{value}</dd>
    </div>
  );
}
