import { useState } from 'react';
import { IconDownload, IconLoader2, IconSparkles } from '@tabler/icons-react';
import { generateCfImage } from '@/api/ai';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/download';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type CfImageModel =
  | '@cf/black-forest-labs/flux-1-schnell'
  | '@cf/bytedance/stable-diffusion-xl-lightning'
  | '@cf/lykon/dreamshaper-8-lcm';

const CF_MODELS: {
  value: CfImageModel;
  label: string;
  hint: string;
  beta?: boolean;
}[] = [
  {
    value: '@cf/black-forest-labs/flux-1-schnell',
    label: 'Flux.1 Schnell',
    hint: 'Default · 12B distilled flow transformer',
  },
  {
    value: '@cf/bytedance/stable-diffusion-xl-lightning',
    label: 'SDXL Lightning',
    hint: 'Lightning-fast 1024px generations',
    beta: true,
  },
  {
    value: '@cf/lykon/dreamshaper-8-lcm',
    label: 'DreamShaper 8 LCM',
    hint: 'Photorealistic Stable Diffusion fine-tune',
  },
];

const PROMPT_PRESETS = [
  {
    id: 'astronaut-panda',
    label: 'Astronaut Panda',
    prompt:
      'A cute red panda wearing a tiny astronaut helmet floating among nebulas, cinematic lighting, ultra detailed',
  },
  {
    id: 'cyberpunk-tokyo',
    label: 'Cyberpunk Tokyo',
    prompt:
      'Cyberpunk Tokyo street at night, rain-soaked neon reflections, holographic billboards, cinematic, ultra detailed',
  },
  {
    id: 'watercolor-village',
    label: 'Watercolor Village',
    prompt:
      'A peaceful Japanese mountain village at sunrise, watercolor painting style, soft light, delicate brush strokes',
  },
  {
    id: 'product-earbuds',
    label: 'Product Shot',
    prompt:
      'Minimalist product photo of sleek matte-black wireless earbuds on white marble, soft studio lighting, shallow depth of field',
  },
  {
    id: 'pixel-dragon',
    label: 'Pixel Dragon',
    prompt:
      '16-bit pixel art of a tiny dragon guarding a glowing crystal cave, retro game aesthetic, vibrant colors',
  },
] as const;

type PresetId = (typeof PROMPT_PRESETS)[number]['id'];

export function AiCfImageCard() {
  const [activePreset, setActivePreset] = useState<PresetId | null>(
    PROMPT_PRESETS[0].id
  );
  const [prompt, setPrompt] = useState<string>(PROMPT_PRESETS[0].prompt);
  const [model, setModel] = useState<CfImageModel>(
    '@cf/black-forest-labs/flux-1-schnell'
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  const activeModel = CF_MODELS.find((m) => m.value === model);

  function onSelectPreset(id: PresetId) {
    const preset = PROMPT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(id);
    setPrompt(preset.prompt);
  }

  function onPromptChange(value: string) {
    setPrompt(value);
    const match = PROMPT_PRESETS.find((p) => p.prompt === value);
    setActivePreset(match?.id ?? null);
  }

  async function onGenerate() {
    setError(undefined);
    setImageUrl(undefined);
    setIsPending(true);
    try {
      const result = await generateCfImage({ data: { prompt, model } });
      setImageUrl(result.imageUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate image.'
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSparkles className="size-5 text-primary" />
          Image Generation · Workers AI
        </CardTitle>
        <CardDescription>
          Powered by Cloudflare Workers AI{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{model}</code>{' '}
          to generate images directly from a text prompt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <Select
            value={model}
            onValueChange={(value) => {
              if (value) setModel(value as CfImageModel);
            }}
          >
            <SelectTrigger className="w-72" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CF_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                  {m.beta ? ' (Beta)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeModel && (
            <p className="text-xs text-muted-foreground">{activeModel.hint}</p>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai-cf-image-prompt">Prompt</Label>
            <div className="flex flex-wrap gap-2">
              {PROMPT_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              id="ai-cf-image-prompt"
              rows={6}
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Describe the image you want to generate..."
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length} characters
              {activePreset === null && ' · custom prompt'}
            </p>
            <Button
              type="button"
              onClick={onGenerate}
              disabled={isPending || prompt.trim().length < 3}
            >
              {isPending ? (
                <>
                  <IconLoader2 className="mr-1 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              {imageUrl && !isPending && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadFile(
                      imageUrl,
                      `cf-${model.replace(/[@/]/g, '-')}-${Date.now()}.jpg`
                    )
                  }
                >
                  <IconDownload className="mr-1 size-4" />
                  Download
                </Button>
              )}
            </div>
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30">
              {error ? (
                <span className="px-4 text-center text-sm text-destructive">
                  {error}
                </span>
              ) : isPending ? (
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt="AI generated"
                  className="size-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-sm text-muted-foreground">
                  Your generated image will appear here.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
