import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPayment,
  createRefund,
  fetchPaymentProviders,
  verifyPayment,
  type CreatePaymentPayload,
  type CreateRefundPayload,
} from '@/lib/api';

export function usePaymentProviders() {
  return useQuery({
    queryKey: ['payments', 'providers'],
    queryFn: fetchPaymentProviders,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRefundPayload) => createRefund(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, provider }: { transactionId: string; provider?: string }) =>
      verifyPayment(transactionId, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
