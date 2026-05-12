'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Model, Tag } from '@/db/types';
import {
  useCreatePrompt,
  useUpdatePrompt,
  useUploadPromptImage,
} from '@/hooks/use-admin-prompts';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { PromptWithMeta } from '@/components/prompt/prompt-types';

type PromptStatus = 'draft' | 'review' | 'published' | 'archived';

interface ImageInput {
  url: string;
  thumbUrl?: string;
  r2Key?: string;
  width?: number;
  height?: number;
  sortOrder?: number;
}

export function PromptForm({
  models,
  tags,
  prompt,
}: {
  models: Model[];
  tags: Tag[];
  prompt?: PromptWithMeta | null;
}) {
  const navigate = useNavigate();
  const createMutation = useCreatePrompt();
  const updateMutation = useUpdatePrompt();
  const uploadMutation = useUploadPromptImage();

  const [title, setTitle] = useState(prompt?.title ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [content, setContent] = useState(prompt?.content ?? '');
  const [sourceUrl, setSourceUrl] = useState(prompt?.sourceUrl ?? '');
  const [sourceAuthor, setSourceAuthor] = useState(prompt?.sourceAuthor ?? '');
  const [status, setStatus] = useState<PromptStatus>(prompt?.status ?? 'draft');
  const [modelIds, setModelIds] = useState<string[]>(
    prompt?.models.map((model) => model.id) ?? []
  );
  const [tagIds, setTagIds] = useState<string[]>(
    prompt?.tags.map((tag) => tag.id) ?? []
  );
  const [images, setImages] = useState<ImageInput[]>(
    prompt?.images.map((image) => ({
      url: image.url,
      thumbUrl: image.thumbUrl ?? undefined,
      r2Key: image.r2Key ?? undefined,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      sortOrder: image.sortOrder,
    })) ?? [{ url: '' }]
  );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending;

  const toggleValue = (
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) => {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  };

  const handleSubmit = () => {
    const payload = {
      title,
      description,
      content,
      sourceUrl,
      sourceAuthor,
      status,
      images: images
        .map((image, index) => ({
          ...image,
          url: image.url.trim(),
          sortOrder: index,
        }))
        .filter((image) => image.url),
      modelIds,
      tagIds,
    };

    if (!payload.title || !payload.description || !payload.content) {
      toast.error('请填写标题、简介和提示词正文');
      return;
    }
    if (payload.images.length === 0) {
      toast.error('至少需要一张效果图');
      return;
    }
    if (modelIds.length === 0 || tagIds.length === 0) {
      toast.error('至少选择一个模型和一个标签');
      return;
    }

    const options = {
      onSuccess: () => {
        toast.success(prompt ? '提示词已更新' : '提示词已创建');
        navigate({ to: '/admin/prompts' });
      },
      onError: (error: Error) => {
        toast.error(error.message || '保存失败，请重试');
      },
    };

    if (prompt) {
      updateMutation.mutate({ ...payload, id: prompt.id }, options);
      return;
    }

    createMutation.mutate(payload, options);
  };

  const uploadImage = (file: File, index: number) => {
    uploadMutation.mutate(file, {
      onSuccess: (result) => {
        setImages((current) =>
          current.map((image, imageIndex) =>
            imageIndex === index
              ? { ...image, url: result.url, r2Key: result.key }
              : image
          )
        );
        toast.success('图片已上传');
      },
      onError: (error) => toast.error(error.message || '图片上传失败'),
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>{prompt ? '编辑提示词' : '新建提示词'}</CardTitle>
          <CardDescription>
            提示词正文保持纯文本，方便用户复制后直接使用。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="prompt-title">标题</Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：赛博朋克风格中文城市人像"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prompt-description">一句话简介</Label>
            <Textarea
              id="prompt-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="这条提示词适合生成什么效果"
              className="min-h-20"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prompt-content">提示词正文</Label>
            <Textarea
              id="prompt-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="输入完整提示词..."
              className="min-h-72 font-mono"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="source-author">来源作者</Label>
              <Input
                id="source-author"
                value={sourceAuthor}
                onChange={(event) => setSourceAuthor(event.target.value)}
                placeholder="选填"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="source-url">来源链接</Label>
              <Input
                id="source-url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>发布设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>状态</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PromptStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="review">待审核</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="archived">已下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? '保存中...' : '保存'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模型</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => toggleValue(model.id, modelIds, setModelIds)}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 text-sm',
                  modelIds.includes(model.id)
                    ? 'border-foreground bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {model.name}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>标签</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleValue(tag.id, tagIds, setTagIds)}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 text-sm',
                  tagIds.includes(tag.id)
                    ? 'border-foreground bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tag.name}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>效果图</CardTitle>
            <CardDescription>至少 1 张，最多 4 张。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                {image.url && (
                  <img
                    src={image.url}
                    alt=""
                    className="aspect-video rounded-md object-cover"
                  />
                )}
                <Input
                  value={image.url}
                  onChange={(event) =>
                    setImages((current) =>
                      current.map((item, imageIndex) =>
                        imageIndex === index
                          ? { ...item, url: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="图片 URL"
                />
                <div className="flex gap-2">
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-sm">
                    <IconUpload className="size-4" />
                    上传
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadMutation.isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadImage(file, index);
                      }}
                    />
                  </label>
                  {images.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setImages((current) =>
                          current.filter(
                            (_, imageIndex) => imageIndex !== index
                          )
                        )
                      }
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {images.length < 4 && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setImages((current) => [...current, { url: '' }])
                }
              >
                <IconPlus className="size-4" />
                添加图片
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
