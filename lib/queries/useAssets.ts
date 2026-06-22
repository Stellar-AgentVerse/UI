import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssetTypes,
  fetchTags,
  fetchAsset,
  createAsset,
  type AssetType,
  type AssetDetail,
  type CreateAssetPayload,
} from '@/lib/api';

export function useAssetTypes() {
  return useQuery<AssetType[]>({
    queryKey: ['assets', 'types'],
    queryFn: fetchAssetTypes,
  });
}

export function useTags() {
  return useQuery<{ id: string; name: string; slug: string }[]>({
    queryKey: ['assets', 'tags'],
    queryFn: fetchTags,
  });
}

export function useAsset(id: string | undefined) {
  return useQuery<AssetDetail>({
    queryKey: ['assets', id],
    queryFn: () => fetchAsset(id!),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation<AssetDetail, Error, CreateAssetPayload & { creator?: string }>({
    mutationFn: (payload) => {
      const { creator, ...rest } = payload;
      return createAsset(rest, creator);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
