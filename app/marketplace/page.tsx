'use client';

import { useEffect, useMemo, useState } from 'react';
import Footer from '@/components/agentverse/Footer';
import NavBar from '@/components/agentverse/NavBar';
import { WalletBar } from '@/components/market/WalletBar';
import { PromptCard } from '@/components/market/PromptCard';
import {
  CardSkeleton,
  Callout,
  EmptyState,
  ErrorState,
} from '@/components/market/primitives';
import { SearchIcon } from '@/components/market/icons';
import { toServerFailure } from '@/lib/api';
import { MARKET_V1_SCOPE_NOTE } from '@/lib/market/scope';
import { useMarketCatalog } from '@/lib/queries';

const PAGE_SIZE = 12;

export default function MarketplacePage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Debounce so a query is not issued for every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const catalog = useMarketCatalog({
    search,
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const items = catalog.data?.items ?? [];
  const total = catalog.data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  const rangeLabel = useMemo(() => {
    if (!total) return '';
    const first = page * PAGE_SIZE + 1;
    const last = Math.min(total, page * PAGE_SIZE + items.length);
    return `Showing ${first}–${last} of ${total} prompt${total === 1 ? '' : 's'}`;
  }, [items.length, page, total]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar
        links={[
          { label: 'Marketplace', href: '/marketplace', active: true },
          { label: 'Wallet', href: '/wallet' },
          { label: 'Dashboard', href: '/dashboard' },
        ]}
        rightContent={<WalletBar />}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[5%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute right-[7%] top-[22%] h-[18rem] w-[18rem] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <header className="mb-8 max-w-3xl space-y-4">
          <p className="section-kicker">Marketplace</p>
          <h1 className="section-title text-4xl md:text-5xl">Curated prompts</h1>
          <p className="section-copy">
            {MARKET_V1_SCOPE_NOTE} Every prompt below comes from the marketplace
            catalog; nothing on this page is sample data.
          </p>
        </header>

        <section aria-labelledby="catalog-heading" className="space-y-6">
          <h2 id="catalog-heading" className="sr-only">
            Prompt catalog
          </h2>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              <SearchIcon className="h-5 w-5" />
            </span>
            <label className="sr-only" htmlFor="catalog-search">
              Search prompts by name or description
            </label>
            <input
              id="catalog-search"
              className="input-surface pl-12"
              placeholder="Search prompts"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <p aria-live="polite" className="min-h-[1.5rem] text-sm text-on-surface-variant">
            {catalog.isPending
              ? 'Loading the prompt catalog…'
              : catalog.isError
                ? ''
                : total > 0
                  ? rangeLabel
                  : ''}
          </p>

          {catalog.isPending ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : catalog.isError ? (
            <ErrorState
              title="The prompt catalog could not be loaded"
              message={`${toServerFailure(catalog.error).message} No sample data is shown in its place, so this page is empty until the marketplace answers.`}
              requestId={toServerFailure(catalog.error).requestId}
              onRetry={() => catalog.refetch()}
              retryLabel="Reload the catalog"
            />
          ) : items.length === 0 ? (
            <EmptyState
              title={search ? 'No prompts match that search' : 'No prompts are published yet'}
              description={
                search
                  ? 'Try a different term, or clear the search to see the whole catalog.'
                  : 'The marketplace answered successfully and returned an empty catalog. Published prompts will appear here as soon as they exist.'
              }
              action={
                search ? (
                  <button
                    type="button"
                    className="market-button-secondary"
                    onClick={() => setSearchInput('')}
                  >
                    Clear search
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="h-full">
                  <PromptCard item={item} />
                </li>
              ))}
            </ul>
          )}

          {total > PAGE_SIZE ? (
            <nav
              aria-label="Catalog pages"
              className="flex items-center justify-between gap-4 pt-2"
            >
              <button
                type="button"
                className="market-button-secondary"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0 || catalog.isFetching}
              >
                Previous
              </button>
              <span className="text-sm text-on-surface-variant">
                Page {page + 1} of {lastPage + 1}
              </span>
              <button
                type="button"
                className="market-button-secondary"
                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                disabled={page >= lastPage || catalog.isFetching}
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>

        <section aria-labelledby="scope-heading" className="mt-12 max-w-3xl">
          <h2 id="scope-heading" className="sr-only">
            What Market V1 does not sell yet
          </h2>
          <Callout tone="idle" title="Only prompts are for sale in Market V1">
            <p>
              Agents, datasets, workflows, models, oracles and credit packages are
              not purchasable yet, so they are not listed here and cannot be bought
              anywhere in the app. They will return once the delivery path for each
              of them is real.
            </p>
          </Callout>
        </section>
      </main>

      <Footer />
    </div>
  );
}
