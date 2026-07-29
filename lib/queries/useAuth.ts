import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAuthUser,
  getAuthToken,
  requestAuthChallenge,
  verifyWalletAuth,
  type AuthResult,
} from '@/lib/api';

export function useAuthSession() {
  return useQuery<AuthResult | null>({
    queryKey: ['auth', 'session'],
    queryFn: () => {
      const user = getAuthUser<AuthResult['user']>();
      return getAuthToken() && user ? { token: getAuthToken()!, user } : null;
    },
    staleTime: Infinity,
  });
}

export function useWalletAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ publicKey, signature }: { publicKey: string; signature: string }) => {
      return verifyWalletAuth(publicKey, signature);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['auth', 'session'], result);
    },
  });
}

export function useAuthChallenge() {
  return useMutation({
    mutationFn: (publicKey: string) => requestAuthChallenge(publicKey),
  });
}
