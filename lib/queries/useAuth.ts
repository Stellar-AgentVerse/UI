import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserProfile,
  getAuthUser,
  getAuthToken,
  login,
  register,
  requestAuthChallenge,
  setAuthToken,
  verifyWalletAuth,
  type AuthResult,
  type LoginPayload,
  type RegisterPayload,
  type User,
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

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (result) => {
      setAuthToken(result.token);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('agentverse.auth.user', JSON.stringify(result.user));
      }
      queryClient.setQueryData(['auth', 'session'], result);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (result) => {
      setAuthToken(result.token);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('agentverse.auth.user', JSON.stringify(result.user));
      }
      queryClient.setQueryData(['auth', 'session'], result);
    },
  });
}

export function useUserProfile() {
  return useQuery<User>({
    queryKey: ['auth', 'profile'],
    queryFn: fetchUserProfile,
    enabled: !!getAuthToken(),
  });
}
