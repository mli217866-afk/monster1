import { getDb } from '@/db';
import {
  collectionItems,
  collections,
  likes,
  models,
  promptImages,
  promptModels,
  prompts,
  promptTags,
  tags,
  type ModelCategory,
  type PromptSort,
  type PromptStatus,
} from '@/db/app.schema';
import { user } from '@/db/auth.schema';
import { getBaseUrl } from '@/lib/urls';
import { adminApiMiddleware } from '@/middlewares/admin-middleware';
import { authApiMiddleware } from '@/middlewares/auth-middleware';
import { uploadFile } from '@/storage';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, count, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const MAX_PROMPT_IMAGES = 4;
const PROMPT_IMAGES_FOLDER = 'prompt-images';
const DEFAULT_COLLECTION_NAME = '我的收藏';

const promptStatusSchema = z.enum(['draft', 'review', 'published', 'archived']);
const promptSortSchema = z.enum(['hot', 'latest', 'likes', 'collects']);
const modelCategorySchema = z.enum(['text', 'image', 'video', 'other']);

const imageInputSchema = z.object({
  url: z.string().min(1),
  thumbUrl: z.string().optional(),
  r2Key: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

const promptWriteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(8000),
  description: z.string().trim().min(1).max(280),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  sourceAuthor: z.string().trim().max(80).optional().or(z.literal('')),
  status: promptStatusSchema.default('draft'),
  images: z.array(imageInputSchema).min(1).max(MAX_PROMPT_IMAGES),
  modelIds: z.array(z.string().min(1)).min(1),
  tagIds: z.array(z.string().min(1)).min(1),
});

const listPromptsSchema = z.object({
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(40).default(20),
  model: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(80).optional(),
  q: z.string().trim().max(24).optional(),
  sort: promptSortSchema.default('hot'),
});

const adminListPromptsSchema = z.object({
  pageIndex: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(80).default(''),
  status: promptStatusSchema.optional(),
});

const promptIdSchema = z.object({ id: z.string().min(1) });
const promptDetailSchema = z.object({ slug: z.string().min(1).max(180) });

function now() {
  return new Date();
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

  return slug || 'prompt';
}

function escapeLike(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function buildSearchText(input: {
  title: string;
  description: string;
  content: string;
  modelNames?: string[];
  tagNames?: string[];
}) {
  return [
    input.title,
    input.description,
    input.content,
    ...(input.modelNames ?? []),
    ...(input.tagNames ?? []),
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function ensureUniqueSlug(
  baseTitle: string,
  excludeId?: string
): Promise<string> {
  const db = getDb();
  const base = slugify(baseTitle);

  for (let index = 0; index < 20; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const conditions = [eq(prompts.slug, candidate)];
    if (excludeId) conditions.push(ne(prompts.id, excludeId));
    const [existing] = await db
      .select({ id: prompts.id })
      .from(prompts)
      .where(and(...conditions))
      .limit(1);
    if (!existing) return candidate;
  }

  return `${base}-${nanoid(6)}`;
}

async function getNamesByIds(table: 'models' | 'tags', ids: string[]) {
  if (ids.length === 0) return [];
  const db = getDb();
  if (table === 'models') {
    const rows = await db
      .select({ name: models.name })
      .from(models)
      .where(inArray(models.id, ids));
    return rows.map((row) => row.name);
  }
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .where(inArray(tags.id, ids));
  return rows.map((row) => row.name);
}

async function recalculateTagUsage(tagIds: string[]) {
  if (tagIds.length === 0) return;
  const db = getDb();
  await Promise.all(
    tagIds.map((tagId) =>
      db
        .update(tags)
        .set({
          usageCount: sql<number>`(
            select count(*)
            from prompt_tags
            where tag_id = ${tagId}
          )`,
          updatedAt: now(),
        })
        .where(eq(tags.id, tagId))
    )
  );
}

type PromptRow = typeof prompts.$inferSelect;
type PromptImageRow = typeof promptImages.$inferSelect;
type ModelRow = typeof models.$inferSelect;
type TagRow = typeof tags.$inferSelect;

async function hydratePrompts(rows: PromptRow[]) {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((row) => row.id);
  const authorIds = rows
    .map((row) => row.authorId)
    .filter((id): id is string => Boolean(id));

  const [imageRows, modelRows, tagRows, authorRows] = await Promise.all([
    db
      .select()
      .from(promptImages)
      .where(inArray(promptImages.promptId, ids))
      .orderBy(asc(promptImages.sortOrder), asc(promptImages.createdAt)),
    db
      .select({
        promptId: promptModels.promptId,
        id: models.id,
        slug: models.slug,
        name: models.name,
        iconUrl: models.iconUrl,
        category: models.category,
        description: models.description,
        isActive: models.isActive,
        sortOrder: models.sortOrder,
        createdAt: models.createdAt,
        updatedAt: models.updatedAt,
      })
      .from(promptModels)
      .innerJoin(models, eq(promptModels.modelId, models.id))
      .where(inArray(promptModels.promptId, ids))
      .orderBy(asc(models.sortOrder), asc(models.name)),
    db
      .select({
        promptId: promptTags.promptId,
        id: tags.id,
        slug: tags.slug,
        name: tags.name,
        description: tags.description,
        usageCount: tags.usageCount,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
      })
      .from(promptTags)
      .innerJoin(tags, eq(promptTags.tagId, tags.id))
      .where(inArray(promptTags.promptId, ids))
      .orderBy(asc(tags.name)),
    authorIds.length > 0
      ? db
          .select({
            id: user.id,
            name: user.name,
            image: user.image,
          })
          .from(user)
          .where(inArray(user.id, authorIds))
      : Promise.resolve([]),
  ]);

  const imagesByPrompt = new Map<string, PromptImageRow[]>();
  for (const image of imageRows) {
    const group = imagesByPrompt.get(image.promptId) ?? [];
    group.push(image);
    imagesByPrompt.set(image.promptId, group);
  }

  const modelsByPrompt = new Map<string, ModelRow[]>();
  for (const row of modelRows) {
    const group = modelsByPrompt.get(row.promptId) ?? [];
    group.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      iconUrl: row.iconUrl,
      category: row.category,
      description: row.description,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    modelsByPrompt.set(row.promptId, group);
  }

  const tagsByPrompt = new Map<string, TagRow[]>();
  for (const row of tagRows) {
    const group = tagsByPrompt.get(row.promptId) ?? [];
    group.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      usageCount: row.usageCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    tagsByPrompt.set(row.promptId, group);
  }

  const authorsById = new Map(authorRows.map((row) => [row.id, row]));

  return rows.map((row) => ({
    ...row,
    images: imagesByPrompt.get(row.id) ?? [],
    models: modelsByPrompt.get(row.id) ?? [],
    tags: tagsByPrompt.get(row.id) ?? [],
    author: row.authorId ? (authorsById.get(row.authorId) ?? null) : null,
  }));
}

function applyPromptSort(sort: PromptSort) {
  if (sort === 'latest') return [desc(prompts.publishedAt), desc(prompts.id)];
  if (sort === 'likes') return [desc(prompts.likeCount), desc(prompts.id)];
  if (sort === 'collects') {
    return [desc(prompts.collectCount), desc(prompts.id)];
  }
  return [
    desc(sql<number>`
      (${prompts.likeCount} * 3)
      + (${prompts.collectCount} * 4)
      + (${prompts.copyCount} * 2)
      + ${prompts.viewCount}
    `),
    desc(prompts.publishedAt),
    desc(prompts.id),
  ];
}

export const getPromptsList = createServerFn({ method: 'GET' })
  .inputValidator(listPromptsSchema)
  .handler(async ({ data }) => {
    const db = getDb();
    const conditions = [eq(prompts.status, 'published' as PromptStatus)];

    if (data.model) {
      conditions.push(sql`
        ${prompts.id} in (
          select pm.prompt_id
          from prompt_models pm
          inner join models m on m.id = pm.model_id
          where m.slug = ${data.model} and m.is_active = 1
        )
      `);
    }

    if (data.tag) {
      conditions.push(sql`
        ${prompts.id} in (
          select pt.prompt_id
          from prompt_tags pt
          inner join tags t on t.id = pt.tag_id
          where t.slug = ${data.tag}
        )
      `);
    }

    if (data.q) {
      const pattern = `%${escapeLike(data.q.toLowerCase())}%`;
      conditions.push(sql`${prompts.searchText} like ${pattern} escape '\\'`);
    }

    const where = and(...conditions);
    const orderBy = applyPromptSort(data.sort);
    const offset = data.pageIndex * data.pageSize;

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(prompts)
        .where(where)
        .orderBy(...orderBy)
        .limit(data.pageSize)
        .offset(offset),
      db.select({ total: count() }).from(prompts).where(where),
    ]);

    return {
      items: await hydratePrompts(items),
      total,
    };
  });

export const getPromptDetail = createServerFn({ method: 'GET' })
  .inputValidator(promptDetailSchema)
  .handler(async ({ data }) => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(prompts)
      .where(
        and(
          eq(prompts.status, 'published' as PromptStatus),
          or(eq(prompts.slug, data.slug), eq(prompts.id, data.slug))!
        )
      )
      .limit(1);

    if (!row) return null;

    await db
      .update(prompts)
      .set({
        viewCount: sql`${prompts.viewCount} + 1`,
        updatedAt: now(),
      })
      .where(eq(prompts.id, row.id));

    const [prompt] = await hydratePrompts([row]);
    return prompt ?? null;
  });

export const getRelatedPrompts = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      limit: z.number().int().min(1).max(12).default(8),
    })
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const relatedIds = db
      .select({ promptId: promptTags.promptId })
      .from(promptTags)
      .where(
        sql`
          ${promptTags.tagId} in (
            select tag_id from prompt_tags where prompt_id = ${data.id}
          )
        `
      );

    const rows = await db
      .select()
      .from(prompts)
      .where(
        and(
          eq(prompts.status, 'published' as PromptStatus),
          ne(prompts.id, data.id),
          inArray(prompts.id, relatedIds)
        )
      )
      .orderBy(desc(prompts.likeCount), desc(prompts.publishedAt))
      .limit(data.limit);

    return hydratePrompts(rows);
  });

export const incrementCopyCount = createServerFn({ method: 'POST' })
  .inputValidator(promptIdSchema)
  .handler(async ({ data }) => {
    const db = getDb();
    await db
      .update(prompts)
      .set({
        copyCount: sql`${prompts.copyCount} + 1`,
        updatedAt: now(),
      })
      .where(
        and(
          eq(prompts.id, data.id),
          eq(prompts.status, 'published' as PromptStatus)
        )
      );
    return { ok: true };
  });

export const getModels = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  return db
    .select()
    .from(models)
    .where(eq(models.isActive, true))
    .orderBy(asc(models.sortOrder), asc(models.name));
});

export const getHotTags = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ limit: z.number().int().min(1).max(40).default(20) })
  )
  .handler(async ({ data }) => {
    const db = getDb();
    return db
      .select()
      .from(tags)
      .orderBy(desc(tags.usageCount), asc(tags.name))
      .limit(data.limit);
  });

export const getTagDetail = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const db = getDb();
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, data.slug))
      .limit(1);

    return tag ?? null;
  });

export const toggleLike = createServerFn({ method: 'POST' })
  .inputValidator(promptIdSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, context.userId), eq(likes.promptId, data.id)))
      .limit(1);

    if (existing) {
      await db
        .delete(likes)
        .where(
          and(eq(likes.userId, context.userId), eq(likes.promptId, data.id))
        );
      await db
        .update(prompts)
        .set({
          likeCount: sql`
            case
              when ${prompts.likeCount} > 0 then ${prompts.likeCount} - 1
              else 0
            end
          `,
          updatedAt: now(),
        })
        .where(eq(prompts.id, data.id));
      return { liked: false };
    }

    await db.insert(likes).values({
      userId: context.userId,
      promptId: data.id,
      createdAt: now(),
    });
    await db
      .update(prompts)
      .set({
        likeCount: sql`${prompts.likeCount} + 1`,
        updatedAt: now(),
      })
      .where(eq(prompts.id, data.id));

    return { liked: true };
  });

async function ensureDefaultCollection(userId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.userId, userId), eq(collections.isDefault, true)))
    .limit(1);

  if (existing) return existing;

  const row = {
    id: nanoid(),
    userId,
    name: DEFAULT_COLLECTION_NAME,
    isDefault: true,
    sortOrder: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.insert(collections).values(row);
  return row;
}

export const getMyCollections = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(async ({ context }) => {
    const db = getDb();
    await ensureDefaultCollection(context.userId);
    return db
      .select()
      .from(collections)
      .where(eq(collections.userId, context.userId))
      .orderBy(desc(collections.isDefault), asc(collections.sortOrder));
  });

export const createCollection = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string().trim().min(1).max(40) }))
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const row = {
      id: nanoid(),
      userId: context.userId,
      name: data.name,
      isDefault: false,
      sortOrder: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await db.insert(collections).values(row);
    return row;
  });

export const renameCollection = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ id: z.string().min(1), name: z.string().trim().min(1).max(40) })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    await db
      .update(collections)
      .set({ name: data.name, updatedAt: now() })
      .where(
        and(
          eq(collections.id, data.id),
          eq(collections.userId, context.userId),
          eq(collections.isDefault, false)
        )
      );
    return { ok: true };
  });

export const deleteCollection = createServerFn({ method: 'POST' })
  .inputValidator(promptIdSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    await db
      .delete(collections)
      .where(
        and(
          eq(collections.id, data.id),
          eq(collections.userId, context.userId),
          eq(collections.isDefault, false)
        )
      );
    return { ok: true };
  });

export const addToCollection = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ collectionId: z.string().min(1), promptId: z.string().min(1) })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.id, data.collectionId),
          eq(collections.userId, context.userId)
        )
      )
      .limit(1);

    if (!collection) throw new Error('Collection not found');

    const [existing] = await db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, data.collectionId),
          eq(collectionItems.promptId, data.promptId)
        )
      )
      .limit(1);

    if (existing) return { ok: true, collected: true };

    await db.insert(collectionItems).values({
      collectionId: data.collectionId,
      promptId: data.promptId,
      createdAt: now(),
    });
    await db
      .update(prompts)
      .set({
        collectCount: sql`${prompts.collectCount} + 1`,
        updatedAt: now(),
      })
      .where(eq(prompts.id, data.promptId));

    return { ok: true, collected: true };
  });

export const removeFromCollection = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ collectionId: z.string().min(1), promptId: z.string().min(1) })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.id, data.collectionId),
          eq(collections.userId, context.userId)
        )
      )
      .limit(1);

    if (!collection) throw new Error('Collection not found');

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, data.collectionId),
          eq(collectionItems.promptId, data.promptId)
        )
      );
    await db
      .update(prompts)
      .set({
        collectCount: sql`
          case
            when ${prompts.collectCount} > 0 then ${prompts.collectCount} - 1
            else 0
          end
        `,
        updatedAt: now(),
      })
      .where(eq(prompts.id, data.promptId));

    return { ok: true, collected: false };
  });

export const getCollectionDetail = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      pageIndex: z.number().int().min(0).default(0),
      pageSize: z.number().int().min(1).max(40).default(20),
    })
  )
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, data.id), eq(collections.userId, context.userId))
      )
      .limit(1);

    if (!collection) return null;

    const where = eq(collectionItems.collectionId, data.id);
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({ prompt: prompts })
        .from(collectionItems)
        .innerJoin(prompts, eq(collectionItems.promptId, prompts.id))
        .where(where)
        .orderBy(desc(collectionItems.createdAt))
        .limit(data.pageSize)
        .offset(data.pageIndex * data.pageSize),
      db.select({ total: count() }).from(collectionItems).where(where),
    ]);

    return {
      collection,
      items: await hydratePrompts(rows.map((row) => row.prompt)),
      total,
    };
  });

export const listAdminPrompts = createServerFn({ method: 'GET' })
  .inputValidator(adminListPromptsSchema)
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const db = getDb();
    const conditions = [];
    if (data.status) conditions.push(eq(prompts.status, data.status));
    if (data.search) {
      const pattern = `%${escapeLike(data.search.toLowerCase())}%`;
      conditions.push(sql`${prompts.searchText} like ${pattern} escape '\\'`);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(prompts)
        .where(where)
        .orderBy(desc(prompts.updatedAt))
        .limit(data.pageSize)
        .offset(data.pageIndex * data.pageSize),
      db.select({ total: count() }).from(prompts).where(where),
    ]);

    return {
      items: await hydratePrompts(items),
      total,
    };
  });

export const getAdminPrompt = createServerFn({ method: 'GET' })
  .inputValidator(promptIdSchema)
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, data.id))
      .limit(1);
    if (!row) return null;
    const [prompt] = await hydratePrompts([row]);
    return prompt ?? null;
  });

export const createPrompt = createServerFn({ method: 'POST' })
  .inputValidator(promptWriteSchema)
  .middleware([adminApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const modelNames = await getNamesByIds('models', data.modelIds);
    const tagNames = await getNamesByIds('tags', data.tagIds);
    const id = nanoid();
    const slug = await ensureUniqueSlug(data.title);
    const timestamp = now();
    const publishedAt = data.status === 'published' ? timestamp : null;

    await db.insert(prompts).values({
      id,
      slug,
      title: data.title,
      content: data.content,
      description: data.description,
      searchText: buildSearchText({
        title: data.title,
        description: data.description,
        content: data.content,
        modelNames,
        tagNames,
      }),
      sourceUrl: emptyToNull(data.sourceUrl),
      sourceAuthor: emptyToNull(data.sourceAuthor),
      status: data.status,
      authorId: context.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt,
    });

    await Promise.all([
      db.insert(promptImages).values(
        data.images.map((image, index) => ({
          id: nanoid(),
          promptId: id,
          url: image.url,
          thumbUrl: image.thumbUrl ?? null,
          r2Key: image.r2Key ?? null,
          width: image.width ?? null,
          height: image.height ?? null,
          sortOrder: image.sortOrder ?? index,
          createdAt: timestamp,
        }))
      ),
      db
        .insert(promptModels)
        .values(data.modelIds.map((modelId) => ({ promptId: id, modelId }))),
      db
        .insert(promptTags)
        .values(data.tagIds.map((tagId) => ({ promptId: id, tagId }))),
    ]);
    await recalculateTagUsage(data.tagIds);

    return { id, slug };
  });

export const updatePrompt = createServerFn({ method: 'POST' })
  .inputValidator(promptWriteSchema.extend({ id: z.string().min(1) }))
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, data.id))
      .limit(1);
    if (!existing) throw new Error('Prompt not found');

    const modelNames = await getNamesByIds('models', data.modelIds);
    const tagNames = await getNamesByIds('tags', data.tagIds);
    const timestamp = now();
    const slug =
      existing.status === 'published'
        ? existing.slug
        : await ensureUniqueSlug(data.title, data.id);
    const publishedAt =
      data.status === 'published'
        ? (existing.publishedAt ?? timestamp)
        : existing.publishedAt;
    const oldTags = await db
      .select({ tagId: promptTags.tagId })
      .from(promptTags)
      .where(eq(promptTags.promptId, data.id));

    await db
      .update(prompts)
      .set({
        slug,
        title: data.title,
        content: data.content,
        description: data.description,
        searchText: buildSearchText({
          title: data.title,
          description: data.description,
          content: data.content,
          modelNames,
          tagNames,
        }),
        sourceUrl: emptyToNull(data.sourceUrl),
        sourceAuthor: emptyToNull(data.sourceAuthor),
        status: data.status,
        updatedAt: timestamp,
        publishedAt,
      })
      .where(eq(prompts.id, data.id));

    await Promise.all([
      db.delete(promptImages).where(eq(promptImages.promptId, data.id)),
      db.delete(promptModels).where(eq(promptModels.promptId, data.id)),
      db.delete(promptTags).where(eq(promptTags.promptId, data.id)),
    ]);

    await Promise.all([
      db.insert(promptImages).values(
        data.images.map((image, index) => ({
          id: nanoid(),
          promptId: data.id,
          url: image.url,
          thumbUrl: image.thumbUrl ?? null,
          r2Key: image.r2Key ?? null,
          width: image.width ?? null,
          height: image.height ?? null,
          sortOrder: image.sortOrder ?? index,
          createdAt: timestamp,
        }))
      ),
      db
        .insert(promptModels)
        .values(
          data.modelIds.map((modelId) => ({ promptId: data.id, modelId }))
        ),
      db
        .insert(promptTags)
        .values(data.tagIds.map((tagId) => ({ promptId: data.id, tagId }))),
    ]);
    await recalculateTagUsage([
      ...oldTags.map((tag) => tag.tagId),
      ...data.tagIds,
    ]);

    return { id: data.id, slug };
  });

export const updatePromptStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ id: z.string().min(1), status: promptStatusSchema })
  )
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const db = getDb();
    const timestamp = now();
    await db
      .update(prompts)
      .set({
        status: data.status,
        publishedAt:
          data.status === 'published'
            ? sql`coalesce(${prompts.publishedAt}, ${timestamp})`
            : undefined,
        updatedAt: timestamp,
      })
      .where(eq(prompts.id, data.id));
    return { ok: true };
  });

export const uploadPromptImage = createServerFn({ method: 'POST' })
  .inputValidator(
    z
      .custom<FormData>((value): value is FormData => value instanceof FormData)
      .transform((form) => {
        const file = form.get('file');
        if (!(file instanceof File)) throw new Error('File not provided');
        return { file };
      })
  )
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const buffer = Buffer.from(await data.file.arrayBuffer());
    return uploadFile(buffer, data.file.name, data.file.type, {
      folder: PROMPT_IMAGES_FOLDER,
      requestOrigin: getBaseUrl(),
    });
  });

export const listAdminModels = createServerFn({ method: 'GET' })
  .middleware([adminApiMiddleware])
  .handler(async () => {
    const db = getDb();
    return db
      .select()
      .from(models)
      .orderBy(asc(models.sortOrder), asc(models.name));
  });

export const saveModel = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1).max(60),
      slug: z.string().trim().min(1).max(80).optional(),
      iconUrl: z.string().optional().or(z.literal('')),
      category: modelCategorySchema.default('text'),
      description: z.string().max(200).optional().or(z.literal('')),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().min(0).max(999).default(0),
    })
  )
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const db = getDb();
    const timestamp = now();
    const id = data.id ?? nanoid();
    const payload = {
      id,
      name: data.name,
      slug: data.slug ? slugify(data.slug) : slugify(data.name),
      iconUrl: emptyToNull(data.iconUrl),
      category: data.category as ModelCategory,
      description: emptyToNull(data.description),
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      updatedAt: timestamp,
    };

    if (data.id) {
      await db.update(models).set(payload).where(eq(models.id, data.id));
    } else {
      await db.insert(models).values({ ...payload, createdAt: timestamp });
    }

    return { id };
  });

export const listAdminTags = createServerFn({ method: 'GET' })
  .middleware([adminApiMiddleware])
  .handler(async () => {
    const db = getDb();
    return db
      .select()
      .from(tags)
      .orderBy(desc(tags.usageCount), asc(tags.name));
  });

export const saveTag = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1).max(40),
      slug: z.string().trim().min(1).max(80).optional(),
      description: z.string().max(200).optional().or(z.literal('')),
    })
  )
  .middleware([adminApiMiddleware])
  .handler(async ({ data }) => {
    const db = getDb();
    const timestamp = now();
    const id = data.id ?? nanoid();
    const payload = {
      id,
      name: data.name,
      slug: data.slug ? slugify(data.slug) : slugify(data.name),
      description: emptyToNull(data.description),
      updatedAt: timestamp,
    };

    if (data.id) {
      await db.update(tags).set(payload).where(eq(tags.id, data.id));
    } else {
      await db.insert(tags).values({
        ...payload,
        usageCount: 0,
        createdAt: timestamp,
      });
    }

    return { id };
  });
