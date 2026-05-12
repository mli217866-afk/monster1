'use client';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAdminPrompts,
  useUpdatePromptStatus,
} from '@/hooks/use-admin-prompts';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

const statuses = ['draft', 'review', 'published', 'archived'] as const;

const statusLabels: Record<(typeof statuses)[number], string> = {
  draft: '草稿',
  review: '待审核',
  published: '已发布',
  archived: '已下架',
};

function toDate(value: Date | number | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function AdminPromptsContent() {
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<
    'draft' | 'review' | 'published' | 'archived' | undefined
  >();
  const pageSize = 20;
  const { data, isLoading } = useAdminPrompts({
    pageIndex,
    pageSize,
    search,
    status,
  });
  const statusMutation = useUpdatePromptStatus();

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageIndex(0);
            }}
            placeholder="搜索标题、简介、提示词..."
            className="max-w-sm"
          />
          <Select
            value={status ?? 'all'}
            onValueChange={(value) => {
              setStatus(
                value === 'all'
                  ? undefined
                  : (value as 'draft' | 'review' | 'published' | 'archived')
              );
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {statuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {statusLabels[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link to="/admin/prompts/new" className={cn(buttonVariants(), 'w-fit')}>
          <IconPlus className="size-4" />
          新建提示词
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>模型</TableHead>
              <TableHead>数据</TableHead>
              <TableHead>更新</TableHead>
              <TableHead className="w-36">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : data?.items.length ? (
              data.items.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell>
                    <div className="font-medium">{prompt.title}</div>
                    <div className="line-clamp-1 text-muted-foreground text-xs">
                      {prompt.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      {statusLabels[prompt.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {prompt.models.map((model) => model.name).join(' / ') ||
                      '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {prompt.copyCount} 复制 / {prompt.likeCount} 赞
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {toDate(prompt.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/prompts/$id/edit"
                        params={{ id: prompt.id }}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'icon-sm',
                        })}
                      >
                        <IconEdit className="size-4" />
                      </Link>
                      {prompt.status !== 'published' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate(
                              { id: prompt.id, status: 'published' },
                              {
                                onSuccess: () => toast.success('已发布'),
                                onError: () => toast.error('发布失败'),
                              }
                            )
                          }
                        >
                          发布
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate(
                              { id: prompt.id, status: 'archived' },
                              {
                                onSuccess: () => toast.success('已下架'),
                                onError: () => toast.error('下架失败'),
                              }
                            )
                          }
                        >
                          下架
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  暂无提示词
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          第 {pageIndex + 1} / {pageCount} 页，共 {total} 条
        </span>
        <div className="flex gap-2">
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
    </div>
  );
}
