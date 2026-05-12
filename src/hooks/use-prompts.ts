import {
  addToCollection,
  createCollection,
  deleteCollection,
  getCollectionDetail,
  getMyCollections,
  incrementCopyCount,
  removeFromCollection,
  renameCollection,
  toggleLike,
} from '@/api/prompts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const promptKeys = {
  all: ['prompts'] as const,
  collections: () => [...promptKeys.all, 'collections'] as const,
  collection: (id: string, pageIndex: number, pageSize: number) =>
    [...promptKeys.collections(), id, pageIndex, pageSize] as const,
};

export function useCopyPrompt() {
  return useMutation({
    mutationFn: (id: string) => incrementCopyCount({ data: { id } }),
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promptId: string) => toggleLike({ data: { id: promptId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
  });
}

export function useMyCollections(enabled = true) {
  return useQuery({
    queryKey: promptKeys.collections(),
    queryFn: () => getMyCollections(),
    enabled,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createCollection({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.collections() });
    },
  });
}

export function useRenameCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      renameCollection({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.collections() });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.collections() });
    },
  });
}

export function useCollectionDetail(
  id: string,
  pageIndex: number,
  pageSize: number
) {
  return useQuery({
    queryKey: promptKeys.collection(id, pageIndex, pageSize),
    queryFn: () => getCollectionDetail({ data: { id, pageIndex, pageSize } }),
    enabled: Boolean(id),
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { collectionId: string; promptId: string }) =>
      addToCollection({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
      queryClient.invalidateQueries({ queryKey: promptKeys.collections() });
    },
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { collectionId: string; promptId: string }) =>
      removeFromCollection({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
      queryClient.invalidateQueries({ queryKey: promptKeys.collections() });
    },
  });
}
