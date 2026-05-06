import { ReleaseCard } from '@/components/changelog/release-card';
import Container from '@/components/layout/container';
import { websiteConfig } from '@/config/website';
import { getChangelogReleases } from '@/lib/changelog';
import { seo } from '@/lib/seo';
import { messages } from '@/messages';
import { createFileRoute, notFound } from '@tanstack/react-router';

const m = messages.changelog;

export const Route = createFileRoute('/(pages)/changelog')({
  loader: () => {
    const releases = getChangelogReleases();
    if (!releases?.length) throw notFound();
    return releases;
  },
  head: () =>
    seo('/changelog', {
      title: `${m.title} | ${websiteConfig.metadata?.name}`,
      description: m.description,
    }),
  component: ChangelogPage,
});

function ChangelogPage() {
  const releases = Route.useLoaderData();

  return (
    <Container className="py-16 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-center text-3xl font-bold tracking-tight">
            {m.title}
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            {m.subtitle}
          </p>
        </div>

        <div className="mt-8">
          {releases?.map((release) => (
            <ReleaseCard key={release.slug} release={release} />
          ))}
        </div>
      </div>
    </Container>
  );
}
