'use client';

import { generateAiImage } from '@/api/ai';
import type { PromptRemixSource } from '@/api/prompt-remix';
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { downloadFile } from '@/lib/download';
import { Link } from '@tanstack/react-router';
import {
  IconArrowLeft,
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const QUICK_TWISTS = [
  {
    label: '更电影感',
    instruction: '保持核心主体不变，强化电影级构图、镜头语言和戏剧光影。',
  },
  {
    label: '更高级材质',
    instruction: '保持整体设定不变，强化材料细节、表面质感和精修级光泽。',
  },
  {
    label: '改成海报',
    instruction: '改为更强视觉中心的海报式构图，主体更突出，留出标题区。',
  },
  {
    label: '更真实',
    instruction: '在保留风格的前提下，提高真实摄影感、镜头细节和自然光影。',
  },
] as const;

export function PromptRemixStudioPage({
  source,
  autoGenerate = false,
}: {
  source: PromptRemixSource;
  autoGenerate?: boolean;
}) {
  const [prompt, setPrompt] = useState(source.content);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);
  const autoStartedRef = useRef(false);

  const trimmedPrompt = prompt.trim();
  const sourceImage = source.image?.url;
  const canReset = prompt !== source.content;
  const statusTone = error
    ? 'border-red-400/30 bg-red-500/14 text-red-200'
    : isPending
      ? 'border-amber-300/30 bg-amber-400/14 text-amber-100'
      : imageUrl
        ? 'border-emerald-300/30 bg-emerald-400/14 text-emerald-100'
        : 'border-white/12 bg-white/6 text-white/70';
  const statusLabel = error
    ? '生成失败'
    : isPending
      ? '正在出图'
      : imageUrl
        ? '结果已就绪'
        : autoGenerate
          ? '已自动开做'
          : '等待你点生成';

  async function onGenerate() {
    if (trimmedPrompt.length < 10) return;

    setError(undefined);
    setImageUrl(undefined);
    setIsPending(true);

    try {
      const result = await generateAiImage({
        data: {
          prompt: trimmedPrompt,
          model: 'openai/gpt-image-2',
          size: source.size,
        },
      });
      setImageUrl(result.imageUrl);
      toast.success('图片生成完成');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '生成失败，请稍后重试。';
      setError(message);
      toast.error('生成失败');
    } finally {
      setIsPending(false);
    }
  }

  useEffect(() => {
    if (!autoGenerate || autoStartedRef.current || trimmedPrompt.length < 10) {
      return;
    }

    autoStartedRef.current = true;
    toast.message('已自动开始生成同款');
    void onGenerate();
  }, [autoGenerate, trimmedPrompt]);

  function applyQuickTwist(instruction: string) {
    setPrompt((current) => {
      const base = current.trim();
      return `${base}\n\n变体要求：${instruction}`;
    });
  }

  return (
    <main className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.12),transparent_24%),linear-gradient(180deg,#f6efe4_0%,#fffdf8_34%,#ede4d7_100%)] text-neutral-950">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/prompt/$slug"
            params={{ slug: source.slug }}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-950"
          >
            <IconArrowLeft className="size-4" />
            返回原提示词详情
          </Link>

          <Badge className="rounded-full border-0 bg-neutral-950 px-3 py-1 text-white hover:bg-neutral-950">
            gpt-image-2
          </Badge>
        </div>

        <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,248,238,0.96))] p-6 shadow-[0_34px_90px_-48px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.08),transparent_22%)]" />

          <div className="relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-neutral-100 shadow-inner">
              {sourceImage ? (
                <img
                  src={sourceImage}
                  alt={source.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-sm text-neutral-400">
                  暂无参考图
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="font-semibold text-3xl tracking-tight sm:text-[2.35rem]">
                  做同款
                </h1>
                <p className="mt-2 text-sm text-neutral-600">{source.title}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-xs text-neutral-600">
                  {source.size}
                </span>
                {source.models.map((model) => (
                  <Badge
                    key={model.id}
                    variant="secondary"
                    className="rounded-full bg-white text-neutral-700"
                  >
                    {model.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(400px,1.06fr)]">
          <div className="space-y-6">
            <Card className="rounded-[32px] border border-white/70 bg-white/88 py-0 shadow-[0_30px_84px_-42px_rgba(15,23,42,0.28)] backdrop-blur">
              <CardHeader className="border-b border-neutral-200/70 py-5">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <IconSparkles className="size-5 text-amber-600" />
                  提示词
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5 py-5">
                <div className="flex flex-wrap gap-2">
                  {QUICK_TWISTS.map((twist) => (
                    <Button
                      key={twist.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-white"
                      onClick={() => applyQuickTwist(twist.instruction)}
                    >
                      <IconSparkles className="size-3.5" />
                      {twist.label}
                    </Button>
                  ))}
                </div>

                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={18}
                  className="min-h-[380px] rounded-[26px] border-neutral-200/90 bg-[#fcfaf5] px-4 py-4 font-mono text-[0.94rem] leading-7 text-neutral-800 shadow-inner selection:bg-amber-200"
                />

                <div className="flex flex-wrap justify-end gap-3">
                  <CopyPromptButton
                    promptId={source.id}
                    content={prompt}
                    variant="outline"
                    className="rounded-full"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPrompt(source.content)}
                    disabled={!canReset}
                    className="rounded-full"
                  >
                    <IconRefresh className="size-4" />
                    恢复
                  </Button>
                  <Button
                    type="button"
                    onClick={onGenerate}
                    disabled={isPending || trimmedPrompt.length < 10}
                    className="rounded-full bg-neutral-950 px-5 text-white hover:bg-neutral-800"
                  >
                    {isPending ? (
                      <>
                        <IconLoader2 className="size-4 animate-spin" />
                        生成中
                      </>
                    ) : imageUrl ? (
                      <>
                        <IconSparkles className="size-4" />
                        重生成
                      </>
                    ) : (
                      <>
                        <IconSparkles className="size-4" />
                        生成
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="relative sticky top-6 overflow-hidden rounded-[32px] border border-black/8 bg-neutral-950 py-0 text-white shadow-[0_36px_96px_-42px_rgba(15,23,42,0.55)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]" />

              <CardHeader className="relative border-white/10 border-b py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl text-white">结果</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={`rounded-full border px-3 py-1 text-[11px] tracking-[0.18em] uppercase ${statusTone}`}
                    >
                      {statusLabel}
                    </div>
                    {imageUrl && !isPending && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full border-white/14 bg-white/6 text-white hover:bg-white/10"
                        onClick={() =>
                          downloadFile(
                            imageUrl,
                            `prompt-create-${source.slug}-${Date.now()}.png`
                          )
                        }
                      >
                        <IconDownload className="size-4" />
                        下载
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative py-5">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/6">
                  {error ? (
                    <div className="flex min-h-[620px] items-center justify-center px-8 text-center text-sm leading-7 text-red-300">
                      {error}
                    </div>
                  ) : isPending ? (
                    <div className="flex min-h-[620px] flex-col items-center justify-center gap-4 px-8 text-center">
                      <div className="rounded-full border border-white/10 bg-white/10 p-4 text-white">
                        <IconLoader2 className="size-8 animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium text-lg text-white">
                          生成中
                        </div>
                      </div>
                    </div>
                  ) : imageUrl ? (
                    <div>
                      <img
                        src={imageUrl}
                        alt={`${source.title} 生成结果`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[620px] flex-col items-center justify-center gap-4 px-8 text-center">
                      <div className="rounded-full border border-white/10 bg-white/10 p-4 text-white">
                        <IconSparkles className="size-8" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-white/58">点一次生成</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
