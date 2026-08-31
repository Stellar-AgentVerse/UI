import { useQuery } from '@tanstack/react-query';
import {
  fetchWalletBalance,
  fetchCreditPackages,
  type WalletBalance,
  type CreditPackagesResponse,
} from '@/lib/api';

export function useWalletBalance(enabled = true) {
  return useQuery<WalletBalance>({
    queryKey: ['wallet', 'balance'],
    queryFn: fetchWalletBalance,
    enabled,
    retry: false,
  });
}

export function useCreditPackages() {
  return useQuery<CreditPackagesResponse>({
    queryKey: ['wallet', 'packages'],
    queryFn: fetchCreditPackages,
  });
}
