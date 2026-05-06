import { useRef, useState } from 'react';
import {
  IconDownload,
  IconLoader2,
  IconPhotoEdit,
  IconUpload,
} from '@tabler/icons-react';
import { editAiImage } from '@/api/ai';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { downloadFile } from '@/lib/download';
import { cn } from '@/lib/utils';

const PROMPT_PRESETS = [
  {
    id: 'caricature',
    label: 'Bobblehead Caricature',
    prompt:
      'Transform this person into a cute bobblehead-style cartoon caricature: oversized round head, tiny shoulders, glossy clean line art, vibrant flat colors, rosy cheeks, friendly smile, plain solid pastel background, sticker-style, keep the original facial features recognizable.',
  },
  {
    id: 'pixar',
    label: 'Pixar 3D',
    prompt:
      'Transform this person into a Pixar-style 3D animated character with big expressive eyes, smooth shaded skin, soft cinematic lighting, friendly smile, clean studio background, keep the original identity recognizable.',
  },
  {
    id: 'anime',
    label: 'Anime Portrait',
    prompt:
      'Transform this person into a high-quality anime character portrait, cel-shaded with crisp linework, expressive sparkling eyes, soft pastel background, Japanese animation style, keep the original facial features recognizable.',
  },
] as const;

type PresetId = (typeof PROMPT_PRESETS)[number]['id'];

const MAX_BYTES = 1_000_000; // 1 MB upload cap

export function AiImageEditCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMeta, setImageMeta] = useState<
    { name: string; size: number } | undefined
  >();
  const [activePreset, setActivePreset] = useState<PresetId | null>(
    PROMPT_PRESETS[0].id
  );
  const [prompt, setPrompt] = useState<string>(PROMPT_PRESETS[0].prompt);
  const [resultUrl, setResultUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

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

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `Image is too large (${(file.size / 1024).toFixed(0)} KB). Please use one under 1 MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
      setImageMeta({ name: file.name, size: file.size });
      setResultUrl(undefined);
      setError(undefined);
    };
    reader.onerror = () => setError('Could not read the selected file.');
    reader.readAsDataURL(file);
  }

  async function onTransform() {
    if (!imageBase64) return;
    setError(undefined);
    setResultUrl(undefined);
    setIsPending(true);
    try {
      const result = await editAiImage({
        data: { imageBase64, prompt },
      });
      setResultUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconPhotoEdit className="size-5 text-primary" />
          Image Editing · Avatar Stylizer
        </CardTitle>
        <CardDescription>
          Powered by fal.ai{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            fal-ai/gemini-25-flash-image/edit
          </code>{' '}
          to turn an uploaded portrait into a stylized cartoon, caricature, or
          anime version.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source portrait (max 1 MB)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconUpload className="mr-1 size-4" />
                  {imageMeta ? 'Change image' : 'Upload image'}
                </Button>
                {imageMeta && (
                  <span className="text-xs text-muted-foreground">
                    {imageMeta.name} · {(imageMeta.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Source preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="px-4 text-center text-sm text-muted-foreground">
                    Upload a portrait to stylize.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-image-edit-prompt">Style prompt</Label>
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
                id="ai-image-edit-prompt"
                rows={4}
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                placeholder="Describe the style you want..."
              />
              <Button
                type="button"
                onClick={onTransform}
                disabled={isPending || !imageBase64 || prompt.trim().length < 5}
              >
                {isPending ? (
                  <>
                    <IconLoader2 className="mr-1 size-4 animate-spin" />
                    Stylizing...
                  </>
                ) : (
                  'Stylize'
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              {resultUrl && !isPending && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadFile(resultUrl, `avatar-stylized-${Date.now()}.png`)
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
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Stylized result"
                  className="size-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-sm text-muted-foreground">
                  Your stylized portrait will appear here.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
