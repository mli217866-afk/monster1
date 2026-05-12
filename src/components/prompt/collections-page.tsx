'use client';

import Container from '@/components/layout/container';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCreateCollection,
  useDeleteCollection,
  useMyCollections,
} from '@/hooks/use-prompts';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { IconFolder, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CollectionsPage() {
  const { data: collections = [], isLoading } = useMyCollections();
  const createMutation = useCreateCollection();
  const deleteMutation = useDeleteCollection();
  const [name, setName] = useState('');

  return (
    <Container className="px-4 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight">我的收藏</h1>
          <p className="mt-2 text-muted-foreground">
            管理你保存过的精选提示词。
          </p>
        </div>

        <div className="flex max-w-md gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="新收藏夹名称"
          />
          <Button
            disabled={createMutation.isPending}
            onClick={() => {
              if (!name.trim()) return;
              createMutation.mutate(name, {
                onSuccess: () => {
                  setName('');
                  toast.success('收藏夹已创建');
                },
                onError: () => toast.error('创建失败'),
              });
            }}
          >
            <IconPlus className="size-4" />
            新建
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">加载中...</div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <Link
                  to="/me/collections/$id"
                  params={{ id: collection.id }}
                  className="flex min-w-0 items-center gap-3"
                >
                  <IconFolder className="size-5 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {collection.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {collection.isDefault ? '默认收藏夹' : '自定义收藏夹'}
                    </div>
                  </div>
                </Link>
                {!collection.isDefault && (
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      'text-muted-foreground'
                    )}
                    onClick={() =>
                      deleteMutation.mutate(collection.id, {
                        onSuccess: () => toast.success('收藏夹已删除'),
                        onError: () => toast.error('删除失败'),
                      })
                    }
                  >
                    <IconTrash className="size-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}
