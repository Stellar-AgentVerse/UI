import { useQuery } from '@tanstack/react-query';
import {
  fetchWalletBalance,
  fetchCreditPackages,
  type WalletBalance,
  type CreditPackage,
} from '@/lib/api';

export function useWalletBalance(user?: string) {
  return useQuery<WalletBalance>({
    queryKey: ['wallet', 'balance', { user }],
    queryFn: () => fetchWalletBalance(user),
  });
}

export function useCreditPackages() {
  return useQuery<CreditPackage[]>({
    queryKey: ['wallet', 'packages'],
    queryFn: fetchCreditPackages,
  });
}
