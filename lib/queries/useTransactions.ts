import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWalletTransactions,
  purchasePackage,
  type WalletTransaction,
  type PurchaseResult,
} from '@/lib/api';

export function useWalletTransactions(user?: string, limit?: number, skip?: number) {
  return useQuery<WalletTransaction[]>({
    queryKey: ['wallet', 'transactions', { user, limit, skip }],
    queryFn: () => fetchWalletTransactions(user, limit, skip),
  });
}

export function usePurchasePackage() {
  const queryClient = useQueryClient();

  return useMutation<PurchaseResult, Error, { packageId: string; user?: string }>({
    mutationFn: ({ packageId, user }) => purchasePackage(packageId, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
