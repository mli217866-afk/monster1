import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Model, Tag } from '@/db/types';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from '@tanstack/react-router';

type FilterSort = 'hot' | 'latest' | 'likes' | 'collects';
type RouteSort = Exclude<FilterSort, 'hot'>;

export function PromptFilters({
  models,
  tags,
  activeModel,
  activeSort,
}: {
  models: Model[];
  tags: Tag[];
  activeModel?: string;
  activeSort: FilterSort;
}) {
  const navigate = useNavigate();
  const routeSort: RouteSort | undefined =
    activeSort === 'hot' ? undefined : activeSort;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center justify-center gap-4 lg:flex-row">
        <div className="flex max-w-full gap-2 overflow-x-auto rounded-full border border-black/8 bg-white/70 p-1.5 shadow-[0_24px_80px_rgba(93,64,35,0.18)] backdrop-blur dark:border-white/5 dark:bg-white/[0.035] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <Link
            to="/"
            search={{ sort: routeSort }}
            className={cn(
              'shrink-0 rounded-full px-5 py-2 text-sm transition',
              activeModel
                ? 'text-neutral-500 hover:bg-black/6 hover:text-neutral-950 dark:text-white/48 dark:hover:bg-white/8 dark:hover:text-white'
                : 'bg-neutral-950 text-white shadow-[0_0_0_4px_rgba(24,24,27,0.08)] dark:bg-white dark:text-black dark:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]'
            )}
          >
            全部
          </Link>
          {models.map((model) => (
            <Link
              key={model.id}
              to="/"
              search={{
                model: model.slug,
                sort: routeSort,
              }}
              className={cn(
                'shrink-0 rounded-full px-5 py-2 text-sm transition',
                activeModel === model.slug
                  ? 'bg-neutral-950 text-white shadow-[0_0_0_4px_rgba(24,24,27,0.08)] dark:bg-white dark:text-black dark:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]'
                  : 'text-neutral-500 hover:bg-black/6 hover:text-neutral-950 dark:text-white/48 dark:hover:bg-white/8 dark:hover:text-white'
              )}
            >
              {model.name}
            </Link>
          ))}
        </div>

        <Select
          value={activeSort}
          onValueChange={(value) =>
            navigate({
              to: '/',
              search: {
                model: activeModel ?? undefined,
                sort: value === 'hot' ? undefined : (value as RouteSort),
              },
            })
          }
        >
          <SelectTrigger className="h-11 w-32 rounded-full border-black/10 bg-white/70 text-neutral-950 shadow-none dark:border-white/10 dark:bg-white/[0.035] dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hot">综合</SelectItem>
            <SelectItem value="latest">最新</SelectItem>
            <SelectItem value="likes">点赞</SelectItem>
            <SelectItem value="collects">收藏</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tags.length > 0 && (
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2">
          {tags.slice(0, 18).map((tag) => (
            <Link
              key={tag.id}
              to="/tag/$slug"
              params={{ slug: tag.slug }}
              className="rounded-full border border-black/10 bg-white/35 px-3 py-1.5 text-neutral-500 text-xs transition hover:border-black/20 hover:bg-white/70 hover:text-neutral-950 dark:border-white/8 dark:bg-transparent dark:text-white/38 dark:hover:border-white/20 dark:hover:bg-white/8 dark:hover:text-white"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
