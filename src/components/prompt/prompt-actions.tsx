'use client';

import { authClient } from '@/auth/client';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  useAddToCollection,
  useMyCollections,
  useToggleLike,
} from '@/hooks/use-prompts';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  IconArrowRight,
  IconHeart,
  IconLogin,
  IconSparkles,
  IconStar,
} from '@tabler/icons-react';
import { Link, useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';

export function PromptActions({
  promptId,
  promptSlug,
}: {
  promptId: string;
  promptSlug: string;
}) {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (state) => state.location.href });
  const isSignedIn = Boolean(session?.user);
  const { data: collections } = useMyCollections(isSignedIn);
  const likeMutation = useToggleLike();
  const addMutation = useAddToCollection();
  const defaultCollection =
    collections?.find((collection) => collection.isDefault) ?? collections?.[0];

  const redirect = `${Routes.Login}?callbackUrl=${encodeURIComponent(pathname)}`;
  const remixButton = (
    <Link
      to="/create/$slug"
      params={{ slug: promptSlug }}
      className={cn(
        buttonVariants({ size: 'lg' }),
        'h-12 rounded-full bg-[linear-gradient(135deg,#111827_0%,#1f2937_58%,#b45309_128%)] px-5 text-white shadow-[0_18px_42px_-24px_rgba(15,23,42,0.72)] transition hover:scale-[1.01] hover:brightness-105'
      )}
    >
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/12">
        <IconSparkles className="size-4" />
      </span>
      <span className="font-medium text-sm">做同款</span>
      <IconArrowRight className="size-4" />
    </Link>
  );

  const secondaryActions = isSignedIn ? (
    <>
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
        className="rounded-full bg-white/85"
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
        className="rounded-full bg-white/85"
      >
        <IconStar className="size-4" />
        收藏
      </Button>
    </>
  ) : (
    <a href={redirect}>
      <Button variant="outline" className="rounded-full bg-white/85">
        <IconLogin className="size-4" />
        登录后点赞收藏
      </Button>
    </a>
  );

  return (
    <div className="flex flex-wrap gap-3">
      {remixButton}
      {secondaryActions}
    </div>
  );
}
