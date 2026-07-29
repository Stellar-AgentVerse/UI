import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  confirmPurchase,
  createPurchaseIntent,
  fetchPurchaseAccess,
} from '@/lib/api';

export function useCreatePurchaseIntent() {
  return useMutation({
    mutationFn: ({ assetId, idempotencyKey }: { assetId: string; idempotencyKey?: string }) =>
      createPurchaseIntent(assetId, idempotencyKey),
  });
}

export function useConfirmPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ purchaseId, transactionHash }: { purchaseId: string; transactionHash: string }) =>
      confirmPurchase(purchaseId, transactionHash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

export function usePurchaseAccess() {
  return useMutation({
    mutationFn: (purchaseId: string) => fetchPurchaseAccess(purchaseId),
  });
}
