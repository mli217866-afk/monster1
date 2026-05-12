import { getHotTags, getModels, getPromptsList } from '@/api/prompts';
import { PromptListPage } from '@/components/prompt/prompt-list-page';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/urls';
import { createFileRoute } from '@tanstack/react-router';

type HomeSort = 'hot' | 'latest' | 'likes' | 'collects';

export const Route = createFileRoute('/')({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    model?: string;
    sort?: 'latest' | 'likes' | 'collects';
  } => {
    const result: { model?: string; sort?: 'latest' | 'likes' | 'collects' } =
      {};
    if (typeof search.model === 'string') result.model = search.model;
    if (
      search.sort === 'latest' ||
      search.sort === 'likes' ||
      search.sort === 'collects'
    ) {
      result.sort = search.sort;
    }
    return result;
  },
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.search);
    const model = params.get('model') ?? undefined;
    const rawSort = params.get('sort');
    const sort: HomeSort =
      rawSort === 'latest' || rawSort === 'likes' || rawSort === 'collects'
        ? rawSort
        : 'hot';
    const [prompts, models, tags] = await Promise.all([
      getPromptsList({
        data: {
          pageIndex: 0,
          pageSize: 24,
          model,
          sort,
        },
      }),
      getModels(),
      getHotTags({ data: { limit: 20 } }),
    ]);

    return { prompts, models, tags, model, sort };
  },
  head: () => {
    const name = websiteConfig.metadata?.name ?? '';
    const title = websiteConfig.metadata?.title ?? '';
    const description = websiteConfig.metadata?.description ?? '';
    const url = getCanonicalUrl('/');
    const webSiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      description,
      url,
    };
    const metadata = seo('/', { title, description });
    return {
      ...metadata,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(webSiteJsonLd),
        },
      ],
    };
  },
  component: IndexPage,
});

function IndexPage() {
  const { prompts, models, tags, model, sort } = Route.useLoaderData();
  return (
    <PromptListPage
      title="精选提示词"
      description="看得见效果、复制就能用。按模型、标签和关键词快速找到适合中文 AI 用户的高质量提示词。"
      prompts={prompts.items}
      total={prompts.total}
      models={models}
      tags={tags}
      activeModel={model}
      activeSort={sort ?? 'hot'}
    />
  );
}
