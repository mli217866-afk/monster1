import {
  createPrompt,
  listAdminModels,
  listAdminPrompts,
  listAdminTags,
  saveModel,
  saveTag,
  updatePrompt,
  updatePromptStatus,
  uploadPromptImage,
} from '@/api/prompts';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export const adminPromptKeys = {
  all: ['admin-prompts'] as const,
  lists: () => [...adminPromptKeys.all, 'lists'] as const,
  list: (params: {
    pageIndex: number;
    pageSize: number;
    search: string;
    status?: string;
  }) => [...adminPromptKeys.lists(), params] as const,
  dictionaries: () => [...adminPromptKeys.all, 'dictionaries'] as const,
  models: () => [...adminPromptKeys.dictionaries(), 'models'] as const,
  tags: () => [...adminPromptKeys.dictionaries(), 'tags'] as const,
};

export type PromptWriteInput = Parameters<typeof createPrompt>[0]['data'];

export function useAdminPrompts(params: {
  pageIndex: number;
  pageSize: number;
  search: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
}) {
  return useQuery({
    queryKey: adminPromptKeys.list(params),
    queryFn: () => listAdminPrompts({ data: params }),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PromptWriteInput) => createPrompt({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPromptKeys.all });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PromptWriteInput & { id: string }) =>
      updatePrompt({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPromptKeys.all });
    },
  });
}

export function useUpdatePromptStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      status: 'draft' | 'review' | 'published' | 'archived';
    }) => updatePromptStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPromptKeys.all });
    },
  });
}

export function useUploadPromptImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return uploadPromptImage({ data: form });
    },
  });
}

export function useAdminModels() {
  return useQuery({
    queryKey: adminPromptKeys.models(),
    queryFn: () => listAdminModels(),
  });
}

export function useAdminTags() {
  return useQuery({
    queryKey: adminPromptKeys.tags(),
    queryFn: () => listAdminTags(),
  });
}

export function useSaveModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof saveModel>[0]['data']) =>
      saveModel({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPromptKeys.models() });
    },
  });
}

export function useSaveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof saveTag>[0]['data']) =>
      saveTag({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPromptKeys.tags() });
    },
  });
}
