'use client';

import Container from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { PromptGrid } from './prompt-grid';
import { useCollectionDetail } from '@/hooks/use-prompts';
import { Link } from '@tanstack/react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import { useState } from 'react';

export function CollectionDetailPage({ id }: { id: string }) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 24;
  const { data, isLoading } = useCollectionDetail(id, pageIndex, pageSize);
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <Container className="px-4 py-10">
      <div className="space-y-6">
        <Link
          to="/me/collections"
          className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          返回收藏夹
        </Link>

        <div>
          <h1 className="font-semibold text-3xl tracking-tight">
            {data?.collection.name ?? '收藏夹'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            共 {data?.total ?? 0} 条提示词
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border p-10 text-center text-muted-foreground">
            加载中...
          </div>
        ) : (
          <PromptGrid prompts={data?.items ?? []} />
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex <= 0}
            onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex >= pageCount - 1}
            onClick={() =>
              setPageIndex((page) => Math.min(pageCount - 1, page + 1))
            }
          >
            下一页
          </Button>
        </div>
      </div>
    </Container>
  );
}
