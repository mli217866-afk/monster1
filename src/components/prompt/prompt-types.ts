import type { Model, Prompt, PromptImage, Tag } from '@/db/types';

export type PromptWithMeta = Prompt & {
  images: PromptImage[];
  models: Model[];
  tags: Tag[];
  author: {
    id: string;
    name: string;
    image: string | null;
  } | null;
};
