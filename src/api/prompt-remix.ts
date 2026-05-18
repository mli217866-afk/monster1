import { getDb } from '@/db';
import {
  models,
  promptImages,
  promptModels,
  prompts,
  type PromptStatus,
} from '@/db/app.schema';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, or } from 'drizzle-orm';
import { z } from 'zod';

const REMIX_IMAGE_SIZES = ['1024x1024', '1536x1024', '1024x1536'] as const;

export type RemixImageSize = (typeof REMIX_IMAGE_SIZES)[number];

export type PromptRemixSource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  image: {
    url: string;
    width: number | null;
    height: number | null;
  } | null;
  models: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  size: RemixImageSize;
};

const remixSourceSchema = z.object({
  slug: z.string().min(1).max(180),
});

export function inferImageSize(image?: {
  width: number | null;
  height: number | null;
}): RemixImageSize {
  if (!image?.width || !image?.height) return '1024x1024';

  const ratio = image.width / image.height;
  if (ratio >= 1.15) return '1536x1024';
  if (ratio <= 0.85) return '1024x1536';
  return '1024x1024';
}

export const getPromptRemixSource = createServerFn({ method: 'GET' })
  .inputValidator(remixSourceSchema)
  .handler(async ({ data }): Promise<PromptRemixSource | null> => {
    const db = getDb();
    const [prompt] = await db
      .select({
        id: prompts.id,
        slug: prompts.slug,
        title: prompts.title,
        description: prompts.description,
        content: prompts.content,
      })
      .from(prompts)
      .where(
        and(
          eq(prompts.status, 'published' as PromptStatus),
          or(eq(prompts.slug, data.slug), eq(prompts.id, data.slug))!
        )
      )
      .limit(1);

    if (!prompt) return null;

    const [image, modelRows] = await Promise.all([
      db
        .select({
          url: promptImages.url,
          width: promptImages.width,
          height: promptImages.height,
        })
        .from(promptImages)
        .where(eq(promptImages.promptId, prompt.id))
        .orderBy(asc(promptImages.sortOrder), asc(promptImages.createdAt))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      db
        .select({
          id: models.id,
          name: models.name,
          slug: models.slug,
        })
        .from(promptModels)
        .innerJoin(models, eq(promptModels.modelId, models.id))
        .where(eq(promptModels.promptId, prompt.id))
        .orderBy(asc(models.sortOrder), asc(models.name)),
    ]);

    return {
      ...prompt,
      image,
      models: modelRows,
      size: inferImageSize(image ?? undefined),
    };
  });
