import type { PromptWithMeta } from './prompt-types';
import { Link } from '@tanstack/react-router';
import { IconCopy, IconHeart, IconStar } from '@tabler/icons-react';

function formatCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

const TAG_LABELS: Record<string, string> = {
  '3D': '三维',
  UI: '界面',
  Mockup: '样机',
  Logo: '标志',
};

const META_TAGS = new Set([
  'AI生图',
  'EvoLinkAI',
  'GPT-Image 2',
  'NanoBanan',
  'YouMind',
]);

function hasChinese(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

function getChineseDescription(prompt: PromptWithMeta) {
  return prompt.description.split('。')[0]?.trim() || 'AI 生图提示词';
}

function getDisplayTags(prompt: PromptWithMeta) {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const tag of prompt.tags) {
    const label = TAG_LABELS[tag.name] ?? tag.name;
    if (META_TAGS.has(label) || seen.has(label)) continue;

    seen.add(label);
    tags.push(label);
  }

  return tags;
}

function getDisplayTitle(prompt: PromptWithMeta) {
  if (hasChinese(prompt.title)) return prompt.title;

  const tags = getDisplayTags(prompt).slice(0, 3);
  if (tags.length > 0) return `${tags.join(' · ')}提示词`;

  return getChineseDescription(prompt);
}

export function PromptCard({
  prompt,
  onOpen,
}: {
  prompt: PromptWithMeta;
  onOpen?: (promptId: string, element: HTMLElement) => void;
}) {
  const image = prompt.images[0];
  const primaryModel = prompt.models[0];
  const displayTitle = getDisplayTitle(prompt);
  const displayTags = getDisplayTags(prompt).slice(0, 3);
  const description = getChineseDescription(prompt);

  return (
    <Link
      to="/prompt/$slug"
      params={{ slug: prompt.slug }}
      data-prompt-id={prompt.id}
      onClick={(event) => onOpen?.(prompt.id, event.currentTarget)}
      onMouseDown={(event) => onOpen?.(prompt.id, event.currentTarget)}
      onTouchStart={(event) => onOpen?.(prompt.id, event.currentTarget)}
      className="group block text-neutral-950 dark:text-white"
    >
      {image ? (
        <img
          src={image.thumbUrl || image.url}
          alt={displayTitle}
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          loading="lazy"
          className="block h-auto w-full transition duration-300 group-hover:brightness-[0.92]"
        />
      ) : (
        <div className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-200 text-neutral-400 text-sm dark:bg-white/5 dark:text-white/35">
          暂无图片
        </div>
      )}

      <div className="mt-3 space-y-2 px-1">
        <div className="flex items-center justify-between gap-3 text-neutral-500 text-xs dark:text-white/45">
          {primaryModel && <span>模型：{primaryModel.name}</span>}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <IconCopy className="size-3.5" />
              {formatCount(prompt.copyCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconHeart className="size-3.5" />
              {formatCount(prompt.likeCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconStar className="size-3.5" />
              {formatCount(prompt.collectCount)}
            </span>
          </div>
        </div>

        <h2 className="line-clamp-2 font-semibold text-base leading-5">
          {displayTitle}
        </h2>

        <p className="line-clamp-1 text-neutral-500 text-sm dark:text-white/45">
          {description}
        </p>

        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-white/10 dark:text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
