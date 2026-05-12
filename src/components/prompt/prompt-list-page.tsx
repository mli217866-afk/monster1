import Container from '@/components/layout/container';
import type { Model, Tag } from '@/db/types';
import { PromptFilters } from './prompt-filters';
import { PromptGrid } from './prompt-grid';
import type { PromptWithMeta } from './prompt-types';

type PromptListSort = 'hot' | 'latest' | 'likes' | 'collects';

export function PromptListPage({
  title,
  description,
  prompts,
  total,
  models = [],
  tags = [],
  activeModel,
  activeTag,
  searchQuery,
  activeSort = 'hot',
  pageSize = 24,
}: {
  title: string;
  description: string;
  prompts: PromptWithMeta[];
  total: number;
  models?: Model[];
  tags?: Tag[];
  activeModel?: string;
  activeTag?: string;
  searchQuery?: string;
  activeSort?: PromptListSort;
  pageSize?: number;
}) {
  return (
    <div className="relative -mx-4 -my-10 min-h-screen overflow-hidden bg-[#f5efe3] text-neutral-950 transition-colors dark:bg-black dark:text-white lg:-my-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(214,146,72,0.24),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(70,95,77,0.16),transparent_28%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.1),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(255,255,255,0.05),transparent_28%)]" />
      <Container className="relative px-4 py-8 lg:py-12">
        <div className="space-y-10">
          <div className="mx-auto max-w-4xl space-y-4 text-center">
            <p className="font-medium text-neutral-500 text-xs uppercase tracking-[0.45em] dark:text-white/45">
              Prompt Gallery
            </p>
            <h1 className="font-semibold text-4xl tracking-tight md:text-6xl">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-neutral-600 leading-7 dark:text-white/58">
              {description}
            </p>
            <p className="text-neutral-500 text-sm dark:text-white/35">
              共 {total} 条精选内容
            </p>
          </div>

          <PromptFilters
            models={models}
            tags={tags}
            activeModel={activeModel}
            activeSort={activeSort}
          />

          <PromptGrid
            prompts={prompts}
            total={total}
            query={{
              model: activeModel,
              tag: activeTag,
              q: searchQuery,
              sort: activeSort,
              pageSize,
            }}
          />
        </div>
      </Container>
    </div>
  );
}
