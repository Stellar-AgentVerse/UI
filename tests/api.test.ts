import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  createPurchaseIntent,
  fetchWalletBalance,
  fetchWalletTransactions,
  getAuthToken,
  getAuthUser,
  verifyWalletAuth,
} from '@/lib/api';

describe('API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('unwraps successful API envelopes and sends the auth token', async () => {
    window.sessionStorage.setItem('agentverse.auth.token', 'token-123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ data: { purchaseId: 'purchase-1' }, meta: { requestId: 'req-1' } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )));

    await expect(createPurchaseIntent('asset-1', 'idem-1')).resolves.toEqual({ purchaseId: 'purchase-1' });
    expect(fetch).toHaveBeenCalledWith('/api/marketplace/purchases', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
    }));
  });

  it('preserves structured error details in ApiError and does not persist failed auth', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ code: 'EXPIRED', message: 'Challenge expired' }),
      { status: 401, statusText: 'Unauthorized' },
    )));

    await expect(verifyWalletAuth('GABC', 'bad-signature')).rejects.toMatchObject({
      status: 401,
      details: { code: 'EXPIRED', message: 'Challenge expired' },
    });
    expect(getAuthToken()).toBeUndefined();
    expect(getAuthUser()).toBeUndefined();
    expect(new ApiError(500, 'Server Error').message).toBe('API 500: Server Error');
  });

  it('persists auth only after a successful wallet verification', async () => {
    const user = { publicKey: 'GABC', status: 'ACTIVE' as const, displayName: 'Ada', avatar: '', createdAt: '', lastLoginAt: '' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ data: { token: 'jwt-1', user } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )));

    await verifyWalletAuth(user.publicKey, 'signature');

    expect(getAuthToken()).toBe('jwt-1');
    expect(getAuthUser()).toEqual(user);
  });

  it('does not treat a stored user without a token as an active session', async () => {
    window.sessionStorage.setItem('agentverse.auth.user', JSON.stringify({ publicKey: 'GABC' }));
    expect(getAuthToken()).toBeUndefined();
    expect(getAuthUser()).toBeTruthy();
  });

  it('uses the authenticated wallet contract without sending a user selector', async () => {
    window.sessionStorage.setItem('agentverse.auth.token', 'token-123');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 })),
      ),
    );

    await fetchWalletBalance();
    await fetchWalletTransactions(20, 5);

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/wallet/balance',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/wallet/transactions?limit=20&skip=5',
      expect.anything(),
    );
    expect(String((fetch as ReturnType<typeof vi.fn>).mock.calls[1][0])).not.toContain('user=');
  });
});
