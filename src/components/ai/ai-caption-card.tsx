import { useRef, useState } from 'react';
import { IconLoader2, IconPhotoScan, IconUpload } from '@tabler/icons-react';
import { captionImage } from '@/api/ai';
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

const PROMPT_PRESETS = [
  'Generate a caption for this image.',
  'Describe what you see in this image in detail.',
  'List 5 keywords that describe this image, comma-separated.',
  'What objects are in this image?',
] as const;

const MAX_BYTES = 1_000_000; // 1 MB upload cap

export function AiCaptionCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMeta, setImageMeta] = useState<
    { name: string; size: number } | undefined
  >();
  const [prompt, setPrompt] = useState<string>(PROMPT_PRESETS[0]);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

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
      setImageBase64(dataUrl.replace(/^data:image\/[^;]+;base64,/, ''));
      setImageMeta({ name: file.name, size: file.size });
      setCaption('');
      setError(undefined);
    };
    reader.onerror = () => setError('Could not read the selected file.');
    reader.readAsDataURL(file);
  }

  async function onCaption() {
    if (!imageBase64) return;
    setError(undefined);
    setCaption('');
    setIsPending(true);
    try {
      const result = await captionImage({
        data: { imageBase64, prompt },
      });
      setCaption(result.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to caption image.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconPhotoScan className="size-5 text-primary" />
          Image Captioning
        </CardTitle>
        <CardDescription>
          Powered by Cloudflare Workers AI{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            @cf/llava-hf/llava-1.5-7b-hf
          </code>{' '}
          to describe an image or answer a question about it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Image (max 1 MB)</Label>
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
                  alt="Preview"
                  className="size-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-sm text-muted-foreground">
                  Upload an image to caption.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-caption-prompt">Prompt</Label>
              <div className="flex flex-wrap gap-2">
                {PROMPT_PRESETS.map((preset) => {
                  const isActive = prompt === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPrompt(preset)}
                      className={
                        isActive
                          ? 'rounded-full border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground'
                          : 'rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted'
                      }
                    >
                      {preset.length > 28 ? `${preset.slice(0, 28)}…` : preset}
                    </button>
                  );
                })}
              </div>
              <Textarea
                id="ai-caption-prompt"
                rows={3}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <Button
                type="button"
                onClick={onCaption}
                disabled={
                  isPending || !imageBase64 || prompt.trim().length === 0
                }
              >
                {isPending ? (
                  <>
                    <IconLoader2 className="mr-1 size-4 animate-spin" />
                    Captioning...
                  </>
                ) : (
                  'Caption Image'
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Result</Label>
              <div className="min-h-[160px] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : isPending ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <IconLoader2 className="size-4 animate-spin" />
                    Reading the image...
                  </span>
                ) : caption ? (
                  caption
                ) : (
                  <span className="text-muted-foreground">
                    The caption will appear here.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
