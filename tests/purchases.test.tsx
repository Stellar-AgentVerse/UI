import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssetDetails from '@/app/assets/[id]/page';

const mocks = vi.hoisted(() => ({ createIntent: vi.fn(), confirm: vi.fn(), access: vi.fn(), connect: vi.fn(), sign: vi.fn() }));

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'asset-1' }) }));
vi.mock('@/lib/stellar-purchase', () => ({ connectFreighter: mocks.connect, signAndSubmitPurchase: mocks.sign }));
vi.mock('@/lib/queries', () => ({
  useAsset: () => ({ data: { id: 'asset-1', name: 'Fixture Prompt', description: 'Test prompt', type: 'PROMPT', price: 10, tags: [], metrics: undefined } }),
  useCreatePurchaseIntent: () => ({ mutateAsync: mocks.createIntent }),
  useConfirmPurchase: () => ({ mutateAsync: mocks.confirm }),
  usePurchaseAccess: () => ({ mutateAsync: mocks.access }),
}));
vi.mock('@/components/agentverse/NavBar', () => ({ default: () => <nav /> }));
vi.mock('@/components/agentverse/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/agentverse/GlassCard', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const intent = { purchaseId: 'purchase-1', unsignedXdr: 'unsigned-xdr', networkPassphrase: 'Test SDF Network ; September 2015', assetId: 'asset-1', amount: 10, expiresAt: '', contractId: '', idempotencyKey: 'idem-1' };

describe('asset purchase UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', { randomUUID: () => 'idem-1' });
    mocks.connect.mockResolvedValue('GABC');
    mocks.sign.mockResolvedValue('tx-1');
    mocks.confirm.mockResolvedValue({ purchaseId: 'purchase-1', status: 'SETTLED' });
    mocks.access.mockResolvedValue({ deliveryReference: 'https://staging.example/delivery' });
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders pending states while preparing and confirming a purchase', async () => {
    let resolveIntent!: (value: typeof intent) => void;
    let resolveConfirm!: (value: { purchaseId: string; status: string }) => void;
    mocks.createIntent.mockReturnValue(new Promise((resolve) => { resolveIntent = resolve; }));
    mocks.confirm.mockReturnValue(new Promise((resolve) => { resolveConfirm = resolve; }));
    const user = userEvent.setup();
    render(<AssetDetails />);

    await user.click(screen.getByRole('button', { name: /Buy prompt/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Preparing transaction…');
    resolveIntent(intent);
    expect(await screen.findByRole('status')).toHaveTextContent('Confirming on Stellar…');
    resolveConfirm({ purchaseId: 'purchase-1', status: 'SETTLED' });
  });

  it('shows failure, retries, replays the same idempotency key, and reaches settled delivery', async () => {
    mocks.createIntent.mockRejectedValueOnce(new Error('temporary backend failure')).mockResolvedValueOnce(intent);
    const user = userEvent.setup();
    render(<AssetDetails />);

    await user.click(screen.getByRole('button', { name: /Buy prompt/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('temporary backend failure');
    await user.click(screen.getByRole('button', { name: /Buy prompt/ }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Access granted. Opening delivery…'));
    expect(mocks.createIntent).toHaveBeenCalledTimes(2);
    expect(mocks.createIntent).toHaveBeenNthCalledWith(1, { assetId: 'asset-1', idempotencyKey: 'idem-1' });
    expect(mocks.createIntent).toHaveBeenNthCalledWith(2, { assetId: 'asset-1', idempotencyKey: 'idem-1' });
  });
});
