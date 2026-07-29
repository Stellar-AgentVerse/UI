import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buyToken,
  fetchTokens,
  sellToken,
  type TokenItem,
  type TokenTransaction,
} from '@/lib/api';

export function useTokens() {
  return useQuery<TokenItem[]>({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });
}

export function useBuyToken() {
  const queryClient = useQueryClient();

  return useMutation<TokenTransaction, Error, { tokenId: string; amount: number }>({
    mutationFn: ({ tokenId, amount }) => buyToken(tokenId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useSellToken() {
  const queryClient = useQueryClient();

  return useMutation<TokenTransaction, Error, { tokenId: string; amount: number }>({
    mutationFn: ({ tokenId, amount }) => sellToken(tokenId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
