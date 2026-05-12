import {
  getHotTags,
  getModels,
  getPromptsList,
  getTagDetail,
} from '@/api/prompts';
import { PromptListPage } from '@/components/prompt/prompt-list-page';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/tag/$slug')({
  loader: async ({ params }) => {
    const tag = await getTagDetail({ data: { slug: params.slug } });
    if (!tag) throw notFound();
    const [prompts, models, tags] = await Promise.all([
      getPromptsList({
        data: { pageIndex: 0, pageSize: 24, tag: params.slug, sort: 'hot' },
      }),
      getModels(),
      getHotTags({ data: { limit: 20 } }),
    ]);

    return { tag, prompts, models, tags };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.tag) return {};
    return seo(`/tag/${params.slug}`, {
      title: `${loaderData.tag.name} 提示词 | ${websiteConfig.metadata?.name}`,
      description:
        loaderData.tag.description ??
        `浏览 ${loaderData.tag.name} 相关精选提示词。`,
    });
  },
  component: TagPage,
});

function TagPage() {
  const { tag, prompts, models, tags } = Route.useLoaderData();
  return (
    <PromptListPage
      title={`${tag.name} 提示词`}
      description={tag.description ?? `浏览 ${tag.name} 相关精选提示词。`}
      prompts={prompts.items}
      total={prompts.total}
      models={models}
      tags={tags}
      activeTag={tag.slug}
    />
  );
}
