import { useQuery } from '@tanstack/react-query';
import {
  fetchDeliveryResult,
  fetchPurchaseAccess,
  type DeliveryResult,
  type PurchaseAccess,
} from '@/lib/api';

/**
 * Authoritative access record for a settled purchase.
 *
 * `retry: false` matters: the interesting answers here are 401 and 400, and
 * repeating them three times only delays the honest state the buyer needs to
 * see. Transport failures are surfaced with an explicit retry control instead.
 */
export function usePurchaseAccessRecord(purchaseId: string | undefined) {
  return useQuery<PurchaseAccess>({
    queryKey: ['marketplace', 'purchase-access', purchaseId],
    queryFn: () => fetchPurchaseAccess(purchaseId!),
    enabled: Boolean(purchaseId),
    retry: false,
  });
}

/**
 * Encrypted delivery result.
 *
 * A 404 is the normal answer until the backend delivery worker has produced a
 * result, so polling is opt-in and bounded by the caller rather than retried
 * blindly.
 */
export function useDeliveryResult(
  purchaseId: string | undefined,
  options: { pollMs?: number } = {},
) {
  return useQuery<DeliveryResult>({
    queryKey: ['prompt-delivery', purchaseId],
    queryFn: () => fetchDeliveryResult(purchaseId!),
    enabled: Boolean(purchaseId),
    retry: false,
    refetchInterval: options.pollMs ?? false,
  });
}
