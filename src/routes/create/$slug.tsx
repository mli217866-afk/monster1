import { getPromptRemixSource } from '@/api/prompt-remix';
import { PromptRemixStudioPage } from '@/components/prompt/prompt-remix-studio-page';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

const remixSearchSchema = z.object({
  auto: z.preprocess(
    (value) => value === true || value === '1' || value === 'true',
    z.boolean()
  ),
});

export const Route = createFileRoute('/create/$slug')({
  validateSearch: remixSearchSchema,
  loader: async ({ params }) => {
    const source = await getPromptRemixSource({ data: { slug: params.slug } });
    if (!source) throw notFound();
    return { source };
  },
  head: ({ loaderData, params }) => {
    const source = loaderData?.source;
    if (!source) return {};

    return seo(`/create/${params.slug}`, {
      title: `一键做同款 | ${source.title} | ${websiteConfig.metadata?.name}`,
      description:
        source.description ||
        '自动带入原提示词，进入独立作图页后一键生成图片。',
      image: source.image?.url,
      type: 'article',
    });
  },
  component: PromptCreateRoute,
});

function PromptCreateRoute() {
  const loaderData = Route.useLoaderData();
  const source = loaderData?.source;
  const search = Route.useSearch();
  if (!source) return null;
  return <PromptRemixStudioPage source={source} autoGenerate={search.auto} />;
}
