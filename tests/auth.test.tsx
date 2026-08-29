import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useAuthSession } from '@/lib/queries/useAuth';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  );
}

describe('auth session state', () => {
  it('returns the authenticated session after successful verification storage', async () => {
    const user = { publicKey: 'GABC', status: 'ACTIVE' as const, displayName: 'Ada', avatar: '', createdAt: '', lastLoginAt: '' };
    window.sessionStorage.setItem('agentverse.auth.token', 'jwt-1');
    window.sessionStorage.setItem('agentverse.auth.user', JSON.stringify(user));

    const { result } = renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ token: 'jwt-1', user }));
  });

  it('returns null for an expired session when its token is missing', async () => {
    window.sessionStorage.setItem('agentverse.auth.user', JSON.stringify({ publicKey: 'GABC' }));

    const { result } = renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeNull());
  });
});
