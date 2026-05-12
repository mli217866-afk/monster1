'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminModels,
  useAdminTags,
  useSaveModel,
  useSaveTag,
} from '@/hooks/use-admin-prompts';
import { useState } from 'react';
import { toast } from 'sonner';

export function ModelsManager() {
  const { data: models = [] } = useAdminModels();
  const mutation = useSaveModel();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<
    'text' | 'image' | 'video' | 'other'
  >('text');

  const submit = () => {
    if (!name.trim()) {
      toast.error('请输入模型名称');
      return;
    }
    mutation.mutate(
      {
        name,
        slug,
        category,
        isActive: true,
        sortOrder: models.length,
      },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          toast.success('模型已保存');
        },
        onError: (error) => toast.error(error.message || '保存失败'),
      }
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>新增模型</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="midjourney"
            />
          </div>
          <div className="grid gap-2">
            <Label>分类</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as 'text' | 'image' | 'video' | 'other')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">文本</SelectItem>
                <SelectItem value="image">生图</SelectItem>
                <SelectItem value="video">视频</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled={mutation.isPending} onClick={submit}>
            保存模型
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>模型列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {models.map((model) => (
            <div
              key={model.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <div className="font-medium">{model.name}</div>
                <div className="text-muted-foreground text-xs">
                  {model.slug}
                </div>
              </div>
              <Badge variant="outline" className="rounded-md">
                {model.category}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function TagsManager() {
  const { data: tags = [] } = useAdminTags();
  const mutation = useSaveTag();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const submit = () => {
    if (!name.trim()) {
      toast.error('请输入标签名称');
      return;
    }
    mutation.mutate(
      { name, slug },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          toast.success('标签已保存');
        },
        onError: (error) => toast.error(error.message || '保存失败'),
      }
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>新增标签</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="portrait"
            />
          </div>
          <Button disabled={mutation.isPending} onClick={submit}>
            保存标签
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>标签列表</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="rounded-md">
              {tag.name} · {tag.usageCount}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
