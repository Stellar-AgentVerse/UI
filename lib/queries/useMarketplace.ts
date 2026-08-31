import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchFeatured,
  fetchTrending,
  fetchCategories,
  searchAssets,
  type MarketplaceItem,
  type MarketplaceSearchResult,
  type Category,
} from '@/lib/api';
import { MARKET_V1_QUERY_TYPE } from '@/lib/market/scope';

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

/**
 * The authoritative Market V1 catalog.
 *
 * Always queries the backend search endpoint constrained to the one asset type
 * Market V1 supports, so the grid can never show an unsupported product. There
 * is no fallback dataset: loading, empty and error are distinct rendered
 * states, which is what issue #6 asks for instead of fictional demo assets.
 */
export function useMarketCatalog(params: {
  search?: string;
  skip?: number;
  take?: number;
}) {
  const search = params.search?.trim() || undefined;
  const skip = params.skip ?? 0;
  const take = params.take ?? 12;

  return useQuery<MarketplaceSearchResult>({
    queryKey: ['marketplace', 'catalog', { search, skip, take }],
    queryFn: () => searchAssets(search, MARKET_V1_QUERY_TYPE, skip, take),
    // Keeps the previous page rendered while the next one loads, so paging
    // does not flash an empty grid.
    placeholderData: keepPreviousData,
  });
}
