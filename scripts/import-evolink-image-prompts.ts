import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

type CategoryConfig = {
  file: string;
  slug: string;
  label: string;
  description: string;
  tags: string[];
};

type ParsedImage = {
  sourceUrl: string;
  localPath: string;
};

type ParsedCase = {
  sourceKey: 'evolink' | 'youmind';
  sourceName: string;
  category: CategoryConfig | null;
  caseNo: number;
  promptId: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  sourceUrl: string | null;
  sourceAuthor: string | null;
  tags: string[];
  images: ParsedImage[];
};

const repoRaw =
  'https://raw.githubusercontent.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/main';
const youMindRepoRaw =
  'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main';
const youMindRepoUrl = 'https://github.com/YouMind-OpenLab/awesome-gpt-image-2';

const categories: CategoryConfig[] = [
  {
    file: 'ecommerce.md',
    slug: 'ecommerce',
    label: '电商产品图',
    description: '电商产品、商业摄影和商品广告主视觉',
    tags: ['tag_ecommerce', 'tag_product_photo', 'tag_marketing'],
  },
  {
    file: 'ad-creative.md',
    slug: 'ad-creative',
    label: '广告创意',
    description: '品牌广告、营销活动和商业创意视觉',
    tags: ['tag_ad_creative', 'tag_marketing', 'tag_product_photo'],
  },
  {
    file: 'portrait.md',
    slug: 'portrait',
    label: '人像摄影',
    description: '人像摄影、头像、写真和角色肖像',
    tags: ['tag_portrait', 'tag_photography'],
  },
  {
    file: 'poster.md',
    slug: 'poster',
    label: '海报插画',
    description: '海报、插画、视觉主 KV 和排版设计',
    tags: ['tag_poster', 'tag_design', 'tag_illustration'],
  },
  {
    file: 'character.md',
    slug: 'character',
    label: '角色设计',
    description: '角色设定、游戏概念、IP 和世界观视觉',
    tags: ['tag_character', 'tag_portrait', 'tag_design'],
  },
  {
    file: 'ui.md',
    slug: 'ui',
    label: 'UI 与社媒',
    description: 'UI mockup、社媒卡片、信息图和界面概念',
    tags: ['tag_ui', 'tag_design', 'tag_mockup'],
  },
  {
    file: 'comparison.md',
    slug: 'comparison',
    label: '对比与社区案例',
    description: '社区测试、模型对比和综合生图案例',
    tags: ['tag_comparison', 'tag_ai_image'],
  },
];

const tagRows = [
  ['tag_ai_image', 'ai-image', 'AI生图', 'AI 文生图、图像生成和视觉创意提示词'],
  ['tag_evolink', 'evolink', 'EvoLinkAI', 'EvoLinkAI GPT-Image-2 案例库'],
  ['tag_youmind', 'youmind', 'YouMind', 'YouMind GPT-Image-2 案例库'],
  ['tag_ecommerce', 'ecommerce', '电商', '电商产品图和商品详情视觉'],
  ['tag_ad_creative', 'ad-creative', '广告创意', '品牌广告和营销视觉'],
  ['tag_character', 'character', '角色', '角色设定、IP 和人物概念'],
  ['tag_ui', 'ui', 'UI', '界面、社媒卡片和产品 mockup'],
  ['tag_comparison', 'comparison', '对比案例', '模型测试和社区对比案例'],
  [
    'tag_product_photo',
    'product-photo',
    '产品图',
    '电商产品、商业摄影和广告视觉',
  ],
  ['tag_marketing', 'marketing', '营销', '营销文案和增长内容'],
  ['tag_3d', '3d', '3D', '3D 场景、等距空间和玩具质感'],
  ['tag_design', 'design', '设计', '视觉设计和创意方向'],
  ['tag_poster', 'poster', '海报', '活动海报、字体排版和视觉主 KV'],
  ['tag_food', 'food', '美食', '美食摄影、饮品和餐饮海报'],
  ['tag_scifi', 'sci-fi', '科幻', '科幻城市、赛博视觉和未来概念'],
  ['tag_storybook', 'storybook', '绘本', '儿童绘本、童话插画和叙事场景'],
  ['tag_gufeng', 'gufeng', '国风', '东方审美、古风角色和国潮视觉'],
  ['tag_portrait', 'portrait', '人像', '人像与角色类提示词'],
  ['tag_game', 'game', '游戏', '游戏场景、概念图和世界观视觉'],
  ['tag_wallpaper', 'wallpaper', '壁纸', '手机壁纸、背景图和抽象视觉'],
  ['tag_sticker', 'sticker', '贴纸', '表情包、贴纸和可爱 IP 套组'],
  ['tag_logo', 'logo', 'Logo', 'Logo、图标和品牌标识'],
  ['tag_infographic', 'infographic', '信息图', '信息图、分镜和版式说明'],
  ['tag_mockup', 'mockup', 'Mockup', '界面 mockup、产品样机和展示图'],
  ['tag_anime', 'anime', '动漫', '动漫、漫画和二次元视觉'],
  ['tag_photography', 'photography', '摄影', '摄影、写实影像和镜头语言'],
  ['tag_typography', 'typography', '字体排版', '文字、字体和排版设计'],
  ['tag_architecture', 'architecture', '建筑空间', '建筑、室内和空间设计'],
  ['tag_fashion', 'fashion', '时尚', '服装、穿搭和时尚大片'],
  ['tag_cinematic', 'cinematic', '电影感', '电影海报、镜头和叙事视觉'],
  ['tag_illustration', 'illustration', '插画', '插画、版画和手绘视觉'],
];

const keywordTags: Array<[RegExp, string]> = [
  [
    /food|burger|coffee|drink|juice|soda|chocolate|cake|dessert|recipe/i,
    'tag_food',
  ],
  [/poster|cover|flyer|key visual|kv|movie|festival/i, 'tag_poster'],
  [
    /portrait|headshot|avatar|selfie|photography|photo shoot|model/i,
    'tag_portrait',
  ],
  [/ui|interface|app|website|dashboard|mockup|landing page/i, 'tag_ui'],
  [/mockup|device|screen|phone|desktop|tablet/i, 'tag_mockup'],
  [/logo|icon|brand mark|symbol/i, 'tag_logo'],
  [/3d|isometric|miniature|diorama|clay|render|cgi/i, 'tag_3d'],
  [/game|rpg|pixel|level|screenshot/i, 'tag_game'],
  [/sticker|emoji|mascot/i, 'tag_sticker'],
  [/anime|manga|comic/i, 'tag_anime'],
  [/sci-fi|science fiction|cyberpunk|futuristic|robot|space/i, 'tag_scifi'],
  [/fashion|outfit|clothing|garment|runway|jewelry/i, 'tag_fashion'],
  [/architecture|interior|building|room|house|museum/i, 'tag_architecture'],
  [/infographic|storyboard|layout|diagram|panel|grid/i, 'tag_infographic'],
  [/typography|typeface|lettering|font|text/i, 'tag_typography'],
  [/cinematic|film|movie|trailer|shot|lens/i, 'tag_cinematic'],
  [
    /watercolor|illustration|vector|flat|storybook|print|poster/i,
    'tag_illustration',
  ],
  [/storybook|children|fairy tale/i, 'tag_storybook'],
  [/chinese|hanfu|ink|oriental|gufeng|国风|古风|水墨/i, 'tag_gufeng'],
];

function sql(value: string | null | number) {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll('&', ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function parseCaseSections(markdown: string) {
  const headings = [
    ...markdown.matchAll(/^### Case\s+(\d+):[^\n]*(?:\r?\n|$)/gm),
  ];

  return headings.map((heading, index) => {
    const start = heading.index ?? 0;
    const next = headings[index + 1]?.index ?? markdown.length;
    return {
      caseNo: Number(heading[1]),
      heading: heading[0].trim(),
      section: markdown.slice(start, next),
    };
  });
}

function parseTitle(heading: string) {
  return (
    heading.match(/^### Case\s+\d+:\s*\[([^\]]+)\]/)?.[1] ??
    heading
      .replace(/^### Case\s+\d+:\s*/, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s*\(by .*$/, '')
      .trim()
  );
}

function parseSourceUrl(heading: string, section: string) {
  return (
    heading.match(/\]\((https?:\/\/[^)]+)\)/)?.[1] ??
    section.match(/\*\*Source\*\*:\s*\[[^\]]+\]\((https?:\/\/[^)]+)\)/)?.[1] ??
    null
  );
}

function parseSourceAuthor(heading: string, section: string) {
  return (
    heading.match(/\(by \[([^\]]+)\]/)?.[1] ??
    section.match(/\*\*Source\*\*:\s*\[([^\]]+)\]/)?.[1] ??
    null
  );
}

function parsePrompt(section: string) {
  const promptBlocks = [
    ...section.matchAll(
      /\*\*Prompt[^*]*\*\*:?\s*```(?:[\w-]+)?\s*([\s\S]*?)```/gi
    ),
  ]
    .map((match) => match[1].trim())
    .filter(Boolean);

  if (promptBlocks.length > 1) {
    return promptBlocks
      .map((prompt, index) => `Prompt ${index + 1}:\n${prompt}`)
      .join('\n\n');
  }

  if (promptBlocks.length === 1) return promptBlocks[0];

  const fenced = section.match(
    /\*\*Prompt:?\*\*:?\s*```(?:[\w-]+)?\s*([\s\S]*?)```/i
  )?.[1];
  if (fenced?.trim()) return fenced.trim();

  const fallback = section.match(
    /\*\*Prompt:?\*\*:?\s*([\s\S]*?)(?:\n\*\*Source\b|$)/i
  )?.[1];

  return fallback
    ?.replace(/^```[\w-]*\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
}

function normalizeImageUrl(rawImageUrl: string) {
  if (rawImageUrl.startsWith('http')) return rawImageUrl;
  if (rawImageUrl.startsWith('/')) return `${repoRaw}${rawImageUrl}`;
  return `${repoRaw}/${rawImageUrl.replace(/^\.\.\//, '')}`;
}

function parseImageUrls(section: string) {
  return unique(
    [...section.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/gi)].map((match) =>
      normalizeImageUrl(match[1])
    )
  );
}

function buildTags(category: CategoryConfig, title: string, prompt: string) {
  const haystack = `${category.label} ${title} ${prompt}`;
  const tags = ['tag_ai_image', 'tag_evolink', ...category.tags];

  for (const [pattern, tag] of keywordTags) {
    if (pattern.test(haystack)) tags.push(tag);
  }

  return unique(tags).slice(0, 8);
}

function parseCase(
  category: CategoryConfig,
  caseSection: ReturnType<typeof parseCaseSections>[number]
) {
  const title = parseTitle(caseSection.heading);
  const prompt = parsePrompt(caseSection.section);
  const imageUrls = parseImageUrls(caseSection.section);

  if (!prompt) {
    throw new Error(
      `${category.file} case ${caseSection.caseNo} prompt not found`
    );
  }

  if (imageUrls.length === 0) {
    throw new Error(
      `${category.file} case ${caseSection.caseNo} image not found`
    );
  }

  const titleSlug = slugify(title) || `case-${caseSection.caseNo}`;
  const slug = `evolink-${category.slug}-${caseSection.caseNo}-${titleSlug}`;
  const promptId = `prompt_evolink_${category.slug.replace(/-/g, '_')}_${caseSection.caseNo}`;
  const sourceUrl = parseSourceUrl(caseSection.heading, caseSection.section);
  const sourceAuthor = parseSourceAuthor(
    caseSection.heading,
    caseSection.section
  );

  return {
    sourceKey: 'evolink' as const,
    sourceName: 'EvoLinkAI',
    category,
    caseNo: caseSection.caseNo,
    promptId,
    slug,
    title,
    description: `${category.description}。来自 EvoLinkAI GPT-Image-2 案例库。`,
    prompt,
    sourceUrl,
    sourceAuthor,
    tags: buildTags(category, title, prompt),
    images: imageUrls.map((sourceUrl, index) => {
      const extension = path.extname(new URL(sourceUrl).pathname) || '.jpg';
      const suffix = index === 0 ? '' : `-${index + 1}`;

      return {
        sourceUrl,
        localPath: `/prompt-covers/evolink/${slug}${suffix}${extension}`,
      };
    }),
  };
}

function parseYouMindSections(markdown: string) {
  const headings = [
    ...markdown.matchAll(/^### No\.\s+(\d+):[^\n]*(?:\r?\n|$)/gm),
  ];

  return headings.map((heading, index) => {
    const start = heading.index ?? 0;
    const next = headings[index + 1]?.index ?? markdown.length;

    return {
      displayNo: Number(heading[1]),
      heading: heading[0].trim(),
      section: markdown.slice(start, next),
    };
  });
}

function parseYouMindBlock(section: string, title: string) {
  return section
    .match(
      new RegExp(
        `####\\s+[^\\n]*${title}\\s*\\n\\n([\\s\\S]*?)(?=\\n####\\s|\\n---\\s*$|$)`,
        'i'
      )
    )?.[1]
    ?.trim();
}

function parseYouMindPrompt(section: string) {
  const promptBlock = parseYouMindBlock(section, 'Prompt');
  if (!promptBlock) return null;

  return promptBlock
    .replace(/^```[\w-]*\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
}

function parseYouMindTitle(heading: string) {
  return heading.replace(/^### No\.\s+\d+:\s*/, '').trim();
}

function parseYouMindAuthor(section: string) {
  const match = section.match(/- \*\*Author:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return { name: null, link: null };

  return { name: match[1], link: match[2] };
}

function parseYouMindSourceUrl(section: string) {
  return (
    section.match(/- \*\*Source:\*\*\s*\[[^\]]+\]\(([^)]+)\)/)?.[1] ?? null
  );
}

function parseYouMindGalleryId(section: string) {
  return (
    section.match(/youmind\.com\/[^)\s]+gpt-image-2-prompts\?id=(\d+)/)?.[1] ??
    null
  );
}

function parseYouMindImages(section: string) {
  const imageSection = parseYouMindBlock(section, 'Generated Images') ?? '';

  return unique(
    [...imageSection.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/gi)].map(
      (match) => match[1]
    )
  );
}

function buildYouMindTags(title: string, prompt: string) {
  const haystack = `${title} ${prompt}`;
  const tags = ['tag_ai_image', 'tag_youmind'];

  for (const [pattern, tag] of keywordTags) {
    if (pattern.test(haystack)) tags.push(tag);
  }

  return unique(tags).slice(0, 8);
}

function parseYouMindCase(
  caseSection: ReturnType<typeof parseYouMindSections>[number],
  fallbackIndex: number
): ParsedCase {
  const title = parseYouMindTitle(caseSection.heading);
  const description =
    parseYouMindBlock(caseSection.section, 'Description') ??
    '来自 YouMind-OpenLab 的 GPT-Image-2 生图提示词案例。';
  const prompt = parseYouMindPrompt(caseSection.section);
  const imageUrls = parseYouMindImages(caseSection.section);
  const galleryId = parseYouMindGalleryId(caseSection.section);
  const sourceUrl =
    parseYouMindSourceUrl(caseSection.section) ?? youMindRepoUrl;
  const author = parseYouMindAuthor(caseSection.section);

  if (!prompt) {
    throw new Error(`YouMind No. ${caseSection.displayNo} prompt not found`);
  }

  if (imageUrls.length === 0) {
    throw new Error(`YouMind No. ${caseSection.displayNo} image not found`);
  }

  const stableId = galleryId ?? String(fallbackIndex + 1);
  const titleSlug = slugify(title) || `case-${stableId}`;
  const slug = `youmind-${stableId}-${titleSlug}`;
  const promptId = `prompt_youm_${stableId}`;

  return {
    sourceKey: 'youmind',
    sourceName: 'YouMind-OpenLab',
    category: null,
    caseNo: Number(stableId),
    promptId,
    slug,
    title,
    description: `${description}。来自 YouMind-OpenLab GPT-Image-2 案例库。`,
    prompt,
    sourceUrl,
    sourceAuthor: author.name,
    tags: buildYouMindTags(title, prompt),
    images: imageUrls.map((sourceUrl, index) => {
      const parsedUrl = new URL(sourceUrl);
      const extension = path.extname(parsedUrl.pathname) || '.jpg';
      const suffix = index === 0 ? '' : `-${index + 1}`;

      return {
        sourceUrl,
        localPath: `/prompt-covers/youmind/${slug}${suffix}${extension}`,
      };
    }),
  };
}

async function download(url: string, outputPath: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function mapLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let cursor = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(workers);
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function values(rows: string[][]) {
  return rows.map((row) => `  (${row.join(', ')})`).join(',\n');
}

function insertStatement(table: string, columns: string[], rows: string[][]) {
  if (rows.length === 0) return '';

  return `INSERT INTO \`${table}\` (${columns
    .map((column) => `\`${column}\``)
    .join(', ')})
VALUES
${values(rows)};`;
}

function insertStatements(
  table: string,
  columns: string[],
  rows: string[][],
  size = 40
) {
  return chunk(rows, size)
    .map((group) => insertStatement(table, columns, group))
    .join('\n\n');
}

function buildSearchText(item: ParsedCase) {
  return [
    item.title,
    item.description,
    item.category?.label,
    item.prompt,
    item.sourceAuthor,
    item.sourceName,
    'GPT-Image 2',
    'NanoBanan',
    item.tags.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 8000);
}

function buildSeed(cases: ParsedCase[]) {
  const now = "cast(unixepoch('subsecond') * 1000 as integer)";

  const promptRows = cases.map((item, index) => {
    const score = cases.length - index;
    return [
      sql(item.promptId),
      sql(item.slug),
      sql(item.title),
      sql(item.prompt),
      sql(item.description),
      sql(buildSearchText(item)),
      sql(item.sourceUrl),
      sql(item.sourceAuthor),
      sql('published'),
      'NULL',
      String(1200 + score * 18),
      String(70 + score * 2),
      String(40 + score),
      String(240 + score * 4),
      now,
      now,
      now,
    ];
  });

  const imageRows = cases.flatMap((item) =>
    item.images.map((image, index) => [
      sql(`image_${item.promptId}_${index + 1}`),
      sql(item.promptId),
      sql(image.localPath),
      sql(image.localPath),
      'NULL',
      'NULL',
      'NULL',
      String(index),
      now,
    ])
  );

  const modelRows = cases.flatMap((item) => [
    [sql(item.promptId), sql('model_nanobanan')],
    [sql(item.promptId), sql('model_gpt_image2')],
  ]);

  const promptTagRows = cases.flatMap((item) =>
    item.tags.map((tagId) => [sql(item.promptId), sql(tagId)])
  );

  return `BEGIN TRANSACTION;

DELETE FROM \`prompt_tags\` WHERE \`prompt_id\` LIKE 'prompt_x_%' OR \`prompt_id\` LIKE 'prompt_image_%' OR \`prompt_id\` LIKE 'prompt_evolink_%' OR \`prompt_id\` LIKE 'prompt_youm_%';
DELETE FROM \`prompt_models\` WHERE \`prompt_id\` LIKE 'prompt_x_%' OR \`prompt_id\` LIKE 'prompt_image_%' OR \`prompt_id\` LIKE 'prompt_evolink_%' OR \`prompt_id\` LIKE 'prompt_youm_%';
DELETE FROM \`prompt_images\` WHERE \`prompt_id\` LIKE 'prompt_x_%' OR \`prompt_id\` LIKE 'prompt_image_%' OR \`prompt_id\` LIKE 'prompt_evolink_%' OR \`prompt_id\` LIKE 'prompt_youm_%';
DELETE FROM \`prompts\` WHERE \`id\` LIKE 'prompt_x_%' OR \`id\` LIKE 'prompt_image_%' OR \`id\` LIKE 'prompt_evolink_%' OR \`id\` LIKE 'prompt_youm_%';
DELETE FROM \`tags\` WHERE \`id\` IN ('tag_x_platform', 'tag_growth', 'tag_personal_brand', 'tag_thread');

INSERT OR IGNORE INTO \`models\`
  (\`id\`, \`slug\`, \`name\`, \`category\`, \`description\`, \`is_active\`, \`sort_order\`, \`created_at\`, \`updated_at\`)
VALUES
  ('model_nanobanan', 'nanobanan', 'NanoBanan', 'image', '主力生图模型，适合人物、产品、广告和商业视觉', true, 0, ${now}, ${now}),
  ('model_gpt_image2', 'gpt-image2', 'GPT-Image 2', 'image', '主力生图模型，适合自然语言图像生成、海报、Logo 和插画', true, 1, ${now}, ${now});

UPDATE \`models\` SET \`sort_order\` = 0, \`is_active\` = true, \`updated_at\` = ${now} WHERE \`id\` = 'model_nanobanan';
UPDATE \`models\` SET \`sort_order\` = 1, \`is_active\` = true, \`updated_at\` = ${now} WHERE \`id\` = 'model_gpt_image2';

INSERT OR IGNORE INTO \`tags\`
  (\`id\`, \`slug\`, \`name\`, \`description\`, \`usage_count\`, \`created_at\`, \`updated_at\`)
VALUES
${values(tagRows.map((row) => row.map(sql).concat(['0', now, now])))};

${insertStatements(
  'prompts',
  [
    'id',
    'slug',
    'title',
    'content',
    'description',
    'search_text',
    'source_url',
    'source_author',
    'status',
    'author_id',
    'view_count',
    'like_count',
    'collect_count',
    'copy_count',
    'created_at',
    'updated_at',
    'published_at',
  ],
  promptRows,
  1
)}

${insertStatements(
  'prompt_images',
  [
    'id',
    'prompt_id',
    'url',
    'thumb_url',
    'r2_key',
    'width',
    'height',
    'sort_order',
    'created_at',
  ],
  imageRows
)}

${insertStatements('prompt_models', ['prompt_id', 'model_id'], modelRows, 80)}

${insertStatements('prompt_tags', ['prompt_id', 'tag_id'], promptTagRows, 120)}

UPDATE \`tags\`
SET
  \`usage_count\` = (
    SELECT count(*)
    FROM \`prompt_tags\`
    WHERE \`prompt_tags\`.\`tag_id\` = \`tags\`.\`id\`
  ),
  \`updated_at\` = ${now};

COMMIT;
`;
}

async function main() {
  const cacheDir = path.join('.tmp', 'image-prompt-sources');
  const evoLinkCaseDir = path.join(cacheDir, 'evolink-cases');
  const youMindReadmePath = path.join(cacheDir, 'youmind-readme.md');
  const evoLinkImageDir = path.join('public', 'prompt-covers', 'evolink');
  const youMindImageDir = path.join('public', 'prompt-covers', 'youmind');
  await mkdir(evoLinkCaseDir, { recursive: true });
  await rm(evoLinkImageDir, { recursive: true, force: true });
  await rm(youMindImageDir, { recursive: true, force: true });
  await mkdir(evoLinkImageDir, { recursive: true });
  await mkdir(youMindImageDir, { recursive: true });

  const parsedCases: ParsedCase[] = [];
  for (const category of categories) {
    const filePath = path.join(evoLinkCaseDir, category.file);
    let content: string;

    try {
      content = await readFile(filePath, 'utf8');
    } catch {
      const response = await fetch(`${repoRaw}/cases/${category.file}`);
      if (!response.ok) throw new Error(`Failed to fetch ${category.file}`);
      content = await response.text();
      await writeFile(filePath, content);
    }

    const cases = parseCaseSections(content).map((section) =>
      parseCase(category, section)
    );
    console.log(`${category.file}: ${cases.length} cases`);
    parsedCases.push(...cases);
  }

  let youMindReadme: string;
  try {
    youMindReadme = await readFile(youMindReadmePath, 'utf8');
  } catch {
    const response = await fetch(`${youMindRepoRaw}/README.md`);
    if (!response.ok) throw new Error('Failed to fetch YouMind README.md');
    youMindReadme = await response.text();
    await writeFile(youMindReadmePath, youMindReadme);
  }

  const youMindCases = parseYouMindSections(youMindReadme).map(
    (section, index) => parseYouMindCase(section, index)
  );
  console.log(`YouMind README.md: ${youMindCases.length} cases`);
  parsedCases.push(...youMindCases);

  const images = parsedCases.flatMap((item) =>
    item.images.map((image) => ({ caseId: item.promptId, image }))
  );

  await mapLimit(images, 8, async (item, index) => {
    const outputPath = path.join('public', item.image.localPath.slice(1));
    await download(item.image.sourceUrl, outputPath);

    if ((index + 1) % 50 === 0 || index + 1 === images.length) {
      console.log(`Downloaded ${index + 1}/${images.length} images`);
    }
  });

  await writeFile(
    path.join('scripts', 'seed-image-prompts.sql'),
    buildSeed(parsedCases)
  );

  console.log(
    `Imported ${parsedCases.length} GPT-Image-2 cases with ${images.length} images.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
