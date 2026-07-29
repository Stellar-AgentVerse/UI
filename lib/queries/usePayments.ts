import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPayment,
  createRefund,
  fetchPayment,
  fetchPaymentProviders,
  fetchPayments,
  verifyPayment,
  type CreatePaymentPayload,
  type CreateRefundPayload,
  type Payment,
} from '@/lib/api';

export function usePayments(params?: { limit?: number; skip?: number; status?: string }) {
  return useQuery<Payment[]>({
    queryKey: ['payments', 'list', params],
    queryFn: () => fetchPayments(params),
  });
}

export function usePayment(id: string | undefined) {
  return useQuery<Payment>({
    queryKey: ['payments', id],
    queryFn: () => fetchPayment(id!),
    enabled: !!id,
  });
}

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
