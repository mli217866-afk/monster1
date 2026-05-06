import { useState } from 'react';
import { IconLoader2, IconMicrophone } from '@tabler/icons-react';
import { synthesizeSpeech } from '@/api/ai';
import { Button } from '@/components/ui/button';
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

type Speaker =
  | 'angus'
  | 'asteria'
  | 'arcas'
  | 'orion'
  | 'orpheus'
  | 'athena'
  | 'luna'
  | 'zeus'
  | 'perseus'
  | 'helios'
  | 'hera'
  | 'stella';

const SPEAKERS: { value: Speaker; label: string }[] = [
  { value: 'asteria', label: 'Asteria · Female (US)' },
  { value: 'luna', label: 'Luna · Female (US)' },
  { value: 'stella', label: 'Stella · Female (US)' },
  { value: 'athena', label: 'Athena · Female (UK)' },
  { value: 'hera', label: 'Hera · Female (US)' },
  { value: 'angus', label: 'Angus · Male (IE)' },
  { value: 'arcas', label: 'Arcas · Male (US)' },
  { value: 'orion', label: 'Orion · Male (US)' },
  { value: 'orpheus', label: 'Orpheus · Male (US)' },
  { value: 'perseus', label: 'Perseus · Male (US)' },
  { value: 'helios', label: 'Helios · Male (UK)' },
  { value: 'zeus', label: 'Zeus · Male (US)' },
];

const SAMPLE_TEXT =
  'Hello from Cloudflare Workers AI. This demo turns text into natural-sounding speech in just one API call.';

export function AiTtsCard() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [speaker, setSpeaker] = useState<Speaker>('asteria');
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  async function onGenerate() {
    setError(undefined);
    setAudioUrl(undefined);
    setIsPending(true);
    try {
      const result = await synthesizeSpeech({ data: { text, speaker } });
      setAudioUrl(result.audioUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to synthesize speech.'
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMicrophone className="size-5 text-primary" />
          Text to Speech
        </CardTitle>
        <CardDescription>
          Powered by Cloudflare Workers AI{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            @cf/deepgram/aura-1
          </code>{' '}
          to synthesize natural speech from text input.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Voice</Label>
            <Select
              value={speaker}
              onValueChange={(value) => {
                if (value) setSpeaker(value as Speaker);
              }}
            >
              <SelectTrigger className="w-56" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEAKERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai-tts-input">Text</Label>
            <Textarea
              id="ai-tts-input"
              rows={6}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type or paste the text you want to read aloud..."
            />
            <p className="text-xs text-muted-foreground">
              {text.length} characters · ~$
              {((text.length / 1000) * 0.015).toFixed(4)} per request
            </p>
            <Button
              type="button"
              onClick={onGenerate}
              disabled={isPending || text.trim().length === 0}
            >
              {isPending ? (
                <>
                  <IconLoader2 className="mr-1 size-4 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                'Synthesize Speech'
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Audio</Label>
            <div className="flex min-h-[160px] w-full items-center justify-center rounded-md border bg-muted/30 p-4">
              {error ? (
                <span className="text-center text-sm text-destructive">
                  {error}
                </span>
              ) : isPending ? (
                <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
              ) : audioUrl ? (
                <audio controls src={audioUrl} className="w-full">
                  <track kind="captions" />
                </audio>
              ) : (
                <span className="text-center text-sm text-muted-foreground">
                  The generated audio will appear here.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
