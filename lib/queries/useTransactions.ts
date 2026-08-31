import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWalletTransactions,
  purchasePackage,
  type WalletTransaction,
} from '@/lib/api';

export function useWalletTransactions(limit?: number, skip?: number, enabled = true) {
  return useQuery<WalletTransaction[]>({
    queryKey: ['wallet', 'transactions', { limit, skip }],
    queryFn: () => fetchWalletTransactions(limit, skip),
    enabled,
    retry: false,
  });
}

export function usePurchasePackage() {
  const queryClient = useQueryClient();

  return useMutation<never, Error, { packageId: string }>({
    mutationFn: ({ packageId }) => purchasePackage(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
