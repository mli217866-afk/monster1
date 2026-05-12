import { getPromptDetail, getRelatedPrompts } from '@/api/prompts';
import { PromptDetailPage } from '@/components/prompt/prompt-detail-page';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/urls';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/prompt/$slug')({
  loader: async ({ params }) => {
    const prompt = await getPromptDetail({ data: { slug: params.slug } });
    if (!prompt) throw notFound();
    const related = await getRelatedPrompts({
      data: { id: prompt.id, limit: 8 },
    });
    return { prompt, related };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.prompt) return {};
    const { prompt } = loaderData;
    const path = `/prompt/${params.slug}`;
    const image = prompt.images[0]?.url;
    const metadata = seo(path, {
      title: `${prompt.title} | ${websiteConfig.metadata?.name}`,
      description: prompt.description,
      image,
      type: 'article',
    });
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      headline: prompt.title,
      description: prompt.description,
      image,
      url: getCanonicalUrl(path),
      author: prompt.author?.name,
    };

    return {
      ...metadata,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: PromptDetailRoute,
});

function PromptDetailRoute() {
  const { prompt, related } = Route.useLoaderData();
  return <PromptDetailPage prompt={prompt} related={related} />;
}
