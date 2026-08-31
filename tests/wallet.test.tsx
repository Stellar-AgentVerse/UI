import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WalletPage from '@/app/wallet/page';

const session = {
  status: 'authenticated' as const,
  wallet: {
    address: 'GABC',
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  user: null,
  error: null,
  diagnosis: null,
  connect: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  invalidate: vi.fn(),
  refreshWallet: vi.fn(),
};

vi.mock('@/lib/market/session', () => ({ useMarketSession: () => session }));
vi.mock('@/lib/queries', () => ({
  useWalletBalance: () => ({
    isPending: false,
    isError: false,
    data: {
      credits: null,
      creditStatus: 'QUARANTINED',
      creditReason: 'HISTORICAL_CREDITS_UNVERIFIED',
      monthlyUsage: 0,
      monthlyAllocation: 100,
      usagePercent: 0,
      onChain: {
        status: 'UNAVAILABLE',
        reason: 'STELLAR_BALANCE_NOT_INTEGRATED',
        xlmBalance: null,
        xlmUsdEstimate: null,
        asOf: null,
      },
    },
  }),
  useWalletTransactions: () => ({
    isPending: false,
    isError: false,
    data: [
      {
        id: 'transaction-1',
        type: 'PURCHASE',
        description: 'Historical record',
        ledgerReference: null,
        amount: 10,
        currency: 'CR',
        createdAt: new Date().toISOString(),
      },
    ],
  }),
}));
vi.mock('@/components/agentverse/NavBar', () => ({ default: () => <nav /> }));
vi.mock('@/components/agentverse/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/agentverse/GlassCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('wallet contract alignment', () => {
  it('does not render quarantined credits or an unverified ledger reference as usable data', () => {
    render(<WalletPage />);

    expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Historical credits are quarantined until their settlement provenance is verified.')).toBeInTheDocument();
    expect(screen.getByText('No verified ledger reference')).toBeInTheDocument();
    expect(screen.queryByText('450')).not.toBeInTheDocument();
  });
});
