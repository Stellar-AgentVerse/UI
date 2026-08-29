'use client';

import { Callout } from './primitives';
import { ShieldIcon, SpinnerIcon, WalletIcon } from './icons';
import { describeNetwork } from '@/lib/market/network';
import { useMarketSession } from '@/lib/market/session';

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Wallet and session control for the navigation bar.
 *
 * It never shows a connected address as if it were a session: "connected" and
 * "signed in" are rendered as two different states, because only the second
 * one lets a purchase succeed.
 */
export function WalletBar() {
  const session = useMarketSession();
  const network = session.wallet
    ? describeNetwork(session.wallet.networkPassphrase)
    : null;

  if (session.status === 'loading') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
        <SpinnerIcon className="h-4 w-4" />
        Checking wallet…
      </span>
    );
  }

  if (session.status === 'disconnected') {
    return (
      <button type="button" onClick={() => void session.connect()} className="market-button-primary">
        <WalletIcon className="h-4 w-4" />
        Connect wallet
      </button>
    );
  }

  const address = session.wallet?.address ?? '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-outline-variant/25 px-3 py-2 text-sm text-on-surface-variant"
        title={address}
      >
        <WalletIcon className="h-4 w-4 shrink-0" />
        <span className="font-label">{shortAddress(address)}</span>
        {network ? (
          <span
            className={
              network.isSupported
                ? 'rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent'
                : 'rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning'
            }
          >
            {network.label}
          </span>
        ) : null}
        <span className="sr-only">Connected wallet address {address}</span>
      </span>

      {session.status === 'authenticated' ? (
        <button type="button" onClick={session.signOut} className="market-button-secondary">
          Sign out
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void session.signIn()}
          disabled={session.status === 'authenticating'}
          className="market-button-primary"
        >
          {session.status === 'authenticating' ? (
            <SpinnerIcon className="h-4 w-4" />
          ) : (
            <ShieldIcon className="h-4 w-4" />
          )}
          {session.status === 'authenticating' ? 'Signing in…' : 'Sign in'}
        </button>
      )}
    </div>
  );
}

/**
 * Session errors, rendered in the page flow rather than in the fixed nav bar
 * so they are reachable by a screen reader and do not overflow the header on a
 * narrow viewport.
 */
export function SessionNotice() {
  const session = useMarketSession();
  if (!session.error && !session.diagnosis) return null;

  return (
    <Callout
      tone="warning"
      title={session.error ?? 'Sign-in could not be completed'}
      live="assertive"
    >
      {session.diagnosis ? <p>{session.diagnosis}</p> : null}
    </Callout>
  );
}
