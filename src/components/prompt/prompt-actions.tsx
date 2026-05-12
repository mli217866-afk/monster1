'use client';

import { authClient } from '@/auth/client';
import { Button } from '@/components/ui/button';
import {
  useAddToCollection,
  useMyCollections,
  useToggleLike,
} from '@/hooks/use-prompts';
import { Routes } from '@/lib/routes';
import { IconHeart, IconLogin, IconStar } from '@tabler/icons-react';
import { useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';

export function PromptActions({ promptId }: { promptId: string }) {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (state) => state.location.href });
  const isSignedIn = Boolean(session?.user);
  const { data: collections } = useMyCollections(isSignedIn);
  const likeMutation = useToggleLike();
  const addMutation = useAddToCollection();

  const redirect = `${Routes.Login}?callbackUrl=${encodeURIComponent(pathname)}`;

  if (!isSignedIn) {
    return (
      <a href={redirect}>
        <Button variant="outline">
          <IconLogin className="size-4" />
          登录后点赞收藏
        </Button>
      </a>
    );
  }

  const defaultCollection =
    collections?.find((collection) => collection.isDefault) ?? collections?.[0];

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={likeMutation.isPending}
        onClick={() =>
          likeMutation.mutate(promptId, {
            onSuccess: (result) => {
              toast.success(result.liked ? '已点赞' : '已取消点赞');
            },
            onError: () => toast.error('点赞失败，请重试'),
          })
        }
      >
        <IconHeart className="size-4" />
        点赞
      </Button>
      <Button
        variant="outline"
        disabled={!defaultCollection || addMutation.isPending}
        onClick={() => {
          if (!defaultCollection) return;
          addMutation.mutate(
            { collectionId: defaultCollection.id, promptId },
            {
              onSuccess: () => toast.success('已加入收藏'),
              onError: () => toast.error('收藏失败，请重试'),
            }
          );
        }}
      >
        <IconStar className="size-4" />
        收藏
      </Button>
    </div>
  );
}
