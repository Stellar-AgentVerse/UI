import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { useConfirmPurchase } from '@/lib/queries/usePurchases';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { confirmPurchase } from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, confirmPurchase: vi.fn() };
});

describe('purchase state transitions', () => {
  it('can retry confirmation and invalidates wallet and marketplace after settlement', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(confirmPurchase)
      .mockRejectedValueOnce(new Error('temporary RPC failure'))
      .mockResolvedValueOnce({ purchaseId: 'purchase-1', status: 'SETTLED' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useConfirmPurchase(), { wrapper });

    await expect(result.current.mutateAsync({ purchaseId: 'purchase-1', transactionHash: 'tx-1' })).rejects.toThrow('temporary RPC failure');
    await act(async () => {
      await expect(result.current.mutateAsync({ purchaseId: 'purchase-1', transactionHash: 'tx-1' })).resolves.toEqual({ purchaseId: 'purchase-1', status: 'SETTLED' });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallet'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['marketplace'] });
    expect(confirmPurchase).toHaveBeenCalledTimes(2);
  });
});
