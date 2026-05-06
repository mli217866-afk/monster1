import { createFileRoute } from '@tanstack/react-router';
import { getBaseUrl } from '@/lib/urls';

/**
 * Dynamic robots.txt
 * https://tanstack.dev/start/latest/docs/framework/react/guide/seo#dynamic-robotstxt
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const base = getBaseUrl().replace(/\/$/, '');
        const robots = `User-agent: *
Allow: /
Disallow: /auth
Disallow: /dashboard
Disallow: /settings
Disallow: /admin

Sitemap: ${base}/sitemap.xml`;

        return new Response(robots, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
