'use client';

import Footer from '@/components/agentverse/Footer';
import GlassCard from '@/components/agentverse/GlassCard';
import NavBar from '@/components/agentverse/NavBar';
import { SessionNotice, WalletBar } from '@/components/market/WalletBar';
import {
  Callout,
  CardSkeleton,
  EmptyState,
  ErrorState,
} from '@/components/market/primitives';
import { toServerFailure, type WalletTransaction } from '@/lib/api';
import { describeNetwork, explorerTransactionUrl } from '@/lib/market/network';
import { useMarketSession } from '@/lib/market/session';
import { useWalletBalance, useWalletTransactions } from '@/lib/queries';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Wallet', href: '/wallet', active: true },
  { label: 'Dashboard', href: '/dashboard' },
];

export default function WalletPage() {
  const session = useMarketSession();
  const address = session.wallet?.address;
  const network = session.wallet
    ? describeNetwork(session.wallet.networkPassphrase)
    : null;

  const balance = useWalletBalance(address);
  const transactions = useWalletTransactions(address);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar links={NAV_LINKS} rightContent={<WalletBar />} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <header className="mb-8 max-w-3xl space-y-4">
          <p className="section-kicker">Wallet</p>
          <h1 className="section-title text-4xl md:text-5xl">Your wallet</h1>
          <p className="section-copy">
            Balances and transactions are read from the marketplace for the account currently
            connected in Freighter. Nothing here is sample data.
          </p>
        </header>

        <div className="mb-6 space-y-4">
          <SessionNotice />
        </div>

        {!address ? (
          <EmptyState
            headingLevel="h2"
            title="No wallet connected"
            description="Connect Freighter to see the balances and transactions the marketplace holds for your account."
            action={
              <button
                type="button"
                className="market-button-primary"
                onClick={() => void session.connect()}
              >
                Connect Freighter
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            <GlassCard className="p-6" hover={false}>
              <h2 className="font-heading text-xl font-semibold text-primary">Connected account</h2>
              <p className="mt-3 break-all font-label text-sm text-on-surface">{address}</p>
              {network ? (
                <p className="mt-2 text-sm text-on-surface-variant">Network: {network.label}</p>
              ) : null}
            </GlassCard>

            <section aria-labelledby="balance-heading" className="space-y-4">
              <h2 id="balance-heading" className="section-title text-2xl">
                Balance
              </h2>
              {balance.isPending ? (
                <CardSkeleton />
              ) : balance.isError ? (
                <ErrorState
                  title="Balance unavailable"
                  message={`${toServerFailure(balance.error).message} No placeholder figure is shown in its place.`}
                  requestId={toServerFailure(balance.error).requestId}
                  onRetry={() => balance.refetch()}
                />
              ) : balance.data ? (
                <GlassCard className="p-6" hover={false}>
                  <dl className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                        Credits
                      </dt>
                      <dd className="mt-2 text-3xl font-semibold text-primary">
                        {balance.data.credits.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                        XLM
                      </dt>
                      <dd className="mt-2 text-3xl font-semibold text-secondary">
                        {balance.data.xlmBalance.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                        Monthly usage
                      </dt>
                      <dd className="mt-2 text-3xl font-semibold text-primary">
                        {balance.data.usagePercent}%
                      </dd>
                    </div>
                  </dl>
                </GlassCard>
              ) : null}
            </section>

            <section aria-labelledby="transactions-heading" className="space-y-4">
              <h2 id="transactions-heading" className="section-title text-2xl">
                Transactions
              </h2>
              {transactions.isPending ? (
                <CardSkeleton />
              ) : transactions.isError ? (
                <ErrorState
                  title="Transactions unavailable"
                  message={toServerFailure(transactions.error).message}
                  requestId={toServerFailure(transactions.error).requestId}
                  onRetry={() => transactions.refetch()}
                />
              ) : (transactions.data?.length ?? 0) === 0 ? (
                <EmptyState
                  title="No transactions yet"
                  description="The marketplace has no recorded transactions for this account."
                />
              ) : (
                <TransactionList
                  transactions={transactions.data ?? []}
                  networkPassphrase={session.wallet?.networkPassphrase}
                />
              )}
            </section>

            <Callout tone="idle" title="Credit packages are not on sale in Market V1">
              <p>
                Market V1 sells curated prompts only, paid for directly from your wallet. Credit
                packages were previously shown here but were never a real product, so they have been
                removed rather than left as a dead end.
              </p>
            </Callout>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function TransactionList({
  transactions,
  networkPassphrase,
}: {
  transactions: WalletTransaction[];
  networkPassphrase?: string;
}) {
  return (
    <ul className="grid gap-3">
      {transactions.map((transaction) => {
        const receipt = explorerTransactionUrl(transaction.txid, networkPassphrase);
        return (
          <li key={transaction.id}>
            <GlassCard className="p-4" hover={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full border border-outline-variant/25 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-on-surface-variant">
                    {transaction.type}
                  </span>
                  <p className="mt-2 text-primary">{transaction.description}</p>
                  <p className="mt-1 break-all font-label text-xs text-on-surface-variant">
                    {transaction.txid}
                  </p>
                  {receipt ? (
                    <a
                      className="focus-ring mt-1 inline-block rounded text-xs font-medium text-accent underline underline-offset-4"
                      href={receipt}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on the network explorer
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : null}
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.amount >= 0 ? 'text-accent' : 'text-danger'
                    }`}
                  >
                    {transaction.amount >= 0 ? '+' : ''}
                    {transaction.amount.toLocaleString()} {transaction.currency}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </GlassCard>
          </li>
        );
      })}
    </ul>
  );
}
