import { createFileRoute, notFound } from '@tanstack/react-router';
import Container from '@/components/layout/container';
import { BlogGrid } from '@/components/blog/blog-grid';
import { BlogPagination } from '@/components/blog/blog-pagination';
import { getPaginatedPosts } from '@/lib/blog';
import { websiteConfig } from '@/config/website';
import { messages } from '@/messages';
import { seo } from '@/lib/seo';

export const Route = createFileRoute('/blog/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page:
      typeof search.page === 'number'
        ? search.page
        : typeof search.page === 'string'
          ? Number(search.page) || undefined
          : undefined,
  }),
  loader: ({ location }) => {
    const page = Number(new URLSearchParams(location.search).get('page')) || 1;
    return getPaginatedPosts(page);
  },
  head: () =>
    seo('/blog', {
      title: `${messages.blog.title} | ${websiteConfig.metadata?.name}`,
      description: messages.blog.description,
    }),
  component: BlogListPage,
});

function BlogListPage() {
  const { posts, totalPages, currentPage } = Route.useLoaderData();
  if (!websiteConfig.blog?.enable) {
    throw notFound();
  }

  return (
    <Container className="py-16 px-4">
      <div className="mx-auto space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {messages.blog.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {messages.blog.description}
          </p>
        </div>
        <BlogGrid posts={posts} />
        <BlogPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </Container>
  );
}
