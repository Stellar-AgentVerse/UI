import { useQuery } from '@tanstack/react-query';
import {
  fetchFeatured,
  fetchTrending,
  fetchCategories,
  searchAssets,
  type MarketplaceItem,
  type MarketplaceSearchResult,
  type Category,
} from '@/lib/api';

export function useFeatured(limit?: number) {
  return useQuery<MarketplaceItem[]>({
    queryKey: ['marketplace', 'featured', { limit }],
    queryFn: () => fetchFeatured(limit),
  });
}

export function useTrending(limit?: number) {
  return useQuery<MarketplaceItem[]>({
    queryKey: ['marketplace', 'trending', { limit }],
    queryFn: () => fetchTrending(limit),
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['marketplace', 'categories'],
    queryFn: fetchCategories,
  });
}

export function useSearchAssets(search?: string, type?: string, skip?: number, take?: number) {
  return useQuery<MarketplaceSearchResult>({
    queryKey: ['marketplace', 'search', { search, type, skip, take }],
    queryFn: () => searchAssets(search, type, skip, take),
    enabled: (search?.length ?? 0) > 2,
  });
}
