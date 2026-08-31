import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssetDetails from '@/app/assets/[id]/page';
import { clearPurchaseRecord } from '@/lib/market/purchase-store';

const mocks = vi.hoisted(() => ({
  createIntent: vi.fn(),
  confirm: vi.fn(),
  sign: vi.fn(),
  submit: vi.fn(),
  poll: vi.fn(),
  session: {
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
  },
}));

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'asset-1' }) }));
vi.mock('@/lib/market/session', () => ({
  useMarketSession: () => mocks.session,
}));
vi.mock('@/lib/market/wallet', () => ({
  signPurchaseTransaction: mocks.sign,
  WalletError: class WalletError extends Error {},
}));
vi.mock('@/lib/market/stellar', () => ({
  explainResultCode: vi.fn(),
  submitSignedTransaction: mocks.submit,
  pollForLedgerResult: mocks.poll,
}));
vi.mock('@/lib/queries/useDelivery', () => ({
  usePurchaseAccessRecord: () => ({
    isSuccess: false,
    isError: true,
    error: new Error('delivery pending'),
    refetch: vi.fn(),
  }),
  useDeliveryResult: () => ({
    isPending: false,
    isError: true,
    error: new Error('delivery pending'),
    refetch: vi.fn(),
  }),
}));
vi.mock('@/lib/queries', () => ({
  useAsset: () => ({
    data: {
      id: 'asset-1',
      name: 'Fixture Prompt',
      slug: 'fixture-prompt',
      description: 'Test prompt',
      type: 'PROMPT',
      creatorPublicKey: 'GCREATOR',
      price: 10,
      status: 'PUBLISHED',
      imageUrl: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: undefined,
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    createPurchaseIntent: mocks.createIntent,
    confirmPurchase: mocks.confirm,
  };
});
vi.mock('@/components/agentverse/NavBar', () => ({ default: () => <nav /> }));
vi.mock('@/components/agentverse/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/agentverse/GlassCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const intent = {
  purchaseId: 'purchase-1',
  unsignedXdr: 'unsigned-xdr',
  networkPassphrase: 'Test SDF Network ; September 2015',
  assetId: 'asset-1',
  amount: 10,
  expiresAt: new Date(Date.now() + 30_000).toISOString(),
  contractId: 'CDEPLOYED',
  idempotencyKey: 'idem-1',
};

describe('asset purchase UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPurchaseRecord('GABC', 'asset-1');
    mocks.session.status = 'authenticated';
    mocks.session.wallet = {
      address: 'GABC',
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
    };
    vi.stubGlobal('crypto', { randomUUID: () => 'idem-1' });
    mocks.sign.mockResolvedValue('signed-xdr');
    mocks.submit.mockResolvedValue({
      outcome: { kind: 'accepted' },
      hash: 'a'.repeat(64),
    });
    mocks.poll.mockResolvedValue({ kind: 'success' });
    mocks.confirm.mockResolvedValue({ purchaseId: 'purchase-1', status: 'VERIFIED' });
  });

  it('renders pending states while preparing and confirming a purchase', async () => {
    let resolveIntent!: (value: typeof intent) => void;
    let resolveConfirm!: (value: { purchaseId: string; status: string }) => void;
    mocks.createIntent.mockReturnValue(
      new Promise((resolve) => {
        resolveIntent = resolve;
      }),
    );
    mocks.confirm.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<AssetDetails />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Buy prompt' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Asking the marketplace to quote this purchase',
    );

    resolveIntent(intent);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Verifying the payment with the marketplace',
      ),
    );
    resolveConfirm({ purchaseId: 'purchase-1', status: 'VERIFIED' });
  });

  it('shows failure, retries with the same idempotency key, and reaches settled delivery', async () => {
    mocks.createIntent
      .mockRejectedValueOnce(new Error('temporary backend failure'))
      .mockResolvedValueOnce(intent);
    const user = userEvent.setup();
    render(<AssetDetails />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Buy prompt' }));
    expect(await screen.findByRole('status')).toHaveTextContent('temporary backend failure');

    await user.click(screen.getByRole('button', { name: 'Buy prompt' }));
    await waitFor(() => expect(screen.getByText('Your delivery')).toBeInTheDocument());

    expect(mocks.createIntent).toHaveBeenCalledTimes(2);
    expect(mocks.createIntent).toHaveBeenNthCalledWith(1, 'asset-1', 'idem-1');
    expect(mocks.createIntent).toHaveBeenNthCalledWith(2, 'asset-1', 'idem-1');
  });
});
