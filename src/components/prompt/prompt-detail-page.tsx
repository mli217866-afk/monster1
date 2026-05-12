import { Badge } from '@/components/ui/badge';
import { CopyPromptButton } from './copy-prompt-button';
import { PromptActions } from './prompt-actions';
import { PromptGrid } from './prompt-grid';
import type { PromptWithMeta } from './prompt-types';
import { Link, useRouter } from '@tanstack/react-router';
import {
  IconArrowLeft,
  IconCopy,
  IconEye,
  IconHeart,
} from '@tabler/icons-react';

function toDate(value: Date | number | string | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function PromptDetailPage({
  prompt,
  related,
}: {
  prompt: PromptWithMeta;
  related: PromptWithMeta[];
}) {
  const router = useRouter();
  const mainImage = prompt.images[0];
  const publishedAt = toDate(prompt.publishedAt);

  const goBack = () => {
    if (window.history.length > 1) {
      router.history.back();
      return;
    }

    void router.navigate({ to: '/' });
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      <button
        type="button"
        onClick={goBack}
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
      >
        <IconArrowLeft className="size-4" />
        返回精选
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-muted">
            {mainImage ? (
              <img
                src={mainImage.url}
                alt={prompt.title}
                className="w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {prompt.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {prompt.images.slice(1).map((image) => (
                <img
                  key={image.id}
                  src={image.thumbUrl || image.url}
                  alt={prompt.title}
                  className="aspect-square rounded-md border object-cover"
                />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {prompt.models.map((model) => (
                <Badge
                  key={model.id}
                  variant="secondary"
                  className="rounded-md"
                >
                  {model.name}
                </Badge>
              ))}
            </div>
            <h1 className="font-semibold text-3xl tracking-tight">
              {prompt.title}
            </h1>
            <p className="text-muted-foreground leading-7">
              {prompt.description}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground text-sm">
              {publishedAt && <span>{publishedAt.toLocaleDateString()}</span>}
              {prompt.author?.name && <span>作者：{prompt.author.name}</span>}
              <span className="inline-flex items-center gap-1">
                <IconEye className="size-4" />
                {prompt.viewCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconHeart className="size-4" />
                {prompt.likeCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconCopy className="size-4" />
                {prompt.copyCount}
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-neutral-50 p-4 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-medium text-sm">提示词</span>
              <CopyPromptButton
                promptId={prompt.id}
                content={prompt.content}
                size="sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(prompt.content);
              }}
              className="block max-h-96 w-full overflow-auto whitespace-pre-wrap text-left font-mono text-sm leading-6"
            >
              {prompt.content}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompt.tags.map((tag) => (
              <Link key={tag.id} to="/tag/$slug" params={{ slug: tag.slug }}>
                <Badge variant="outline" className="rounded-md">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>

          <PromptActions promptId={prompt.id} />

          {(prompt.sourceAuthor || prompt.sourceUrl) && (
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">来源标注</div>
              <div className="mt-2 text-muted-foreground">
                {prompt.sourceAuthor}
                {prompt.sourceUrl && (
                  <a
                    href={prompt.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 underline underline-offset-4"
                  >
                    原链接
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14 space-y-5">
          <div>
            <h2 className="font-semibold text-xl">相关推荐</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              同标签下的其他精选提示词
            </p>
          </div>
          <PromptGrid prompts={related} />
        </section>
      )}
    </main>
  );
}
