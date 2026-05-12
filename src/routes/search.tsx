import { getHotTags, getModels, getPromptsList } from '@/api/prompts';
import { PromptListPage } from '@/components/prompt/prompt-list-page';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q.slice(0, 24) : '',
  }),
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') ?? '').slice(0, 24);
    const [prompts, models, tags] = await Promise.all([
      getPromptsList({
        data: { pageIndex: 0, pageSize: 24, q, sort: 'hot' },
      }),
      getModels(),
      getHotTags({ data: { limit: 20 } }),
    ]);

    return { prompts, models, tags, q };
  },
  head: ({ loaderData }) =>
    seo('/search', {
      title: `搜索 ${loaderData?.q ?? ''} | ${websiteConfig.metadata?.name}`,
      description: '搜索精选提示词、模型和标签。',
    }),
  component: SearchPage,
});

function SearchPage() {
  const { prompts, models, tags, q } = Route.useLoaderData();
  return (
    <PromptListPage
      title={q ? `搜索：${q}` : '搜索提示词'}
      description="输入关键词后，系统会在标题、简介、提示词正文和标签中做模糊匹配。"
      prompts={prompts.items}
      total={prompts.total}
      models={models}
      tags={tags}
      searchQuery={q}
    />
  );
}
