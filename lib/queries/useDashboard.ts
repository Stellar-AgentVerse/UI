import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardMetrics,
  fetchTopAssets,
  fetchActivityLogs,
  type DashboardMetrics,
  type TopAsset,
  type ActivityLogItem,
} from '@/lib/api';

export function useDashboardMetrics(creator?: string) {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics', { creator }],
    queryFn: () => fetchDashboardMetrics(creator),
  });
}

export function useTopAssets(creator?: string, limit?: number) {
  return useQuery<TopAsset[]>({
    queryKey: ['dashboard', 'top-assets', { creator, limit }],
    queryFn: () => fetchTopAssets(creator, limit),
  });
}

export function useActivityLogs(creator?: string, limit?: number) {
  return useQuery<ActivityLogItem[]>({
    queryKey: ['dashboard', 'activity-logs', { creator, limit }],
    queryFn: () => fetchActivityLogs(creator, limit),
  });
}
