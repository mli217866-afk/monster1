import { useState } from 'react';
import {
  IconArrowsExchange,
  IconLanguage,
  IconLoader2,
} from '@tabler/icons-react';
import { translateText } from '@/api/ai';
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

type Language =
  | 'english'
  | 'chinese'
  | 'french'
  | 'german'
  | 'spanish'
  | 'japanese'
  | 'korean'
  | 'russian'
  | 'portuguese'
  | 'arabic';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'chinese', label: '中文 Chinese' },
  { value: 'french', label: 'Français French' },
  { value: 'german', label: 'Deutsch German' },
  { value: 'spanish', label: 'Español Spanish' },
  { value: 'japanese', label: '日本語 Japanese' },
  { value: 'korean', label: '한국어 Korean' },
  { value: 'russian', label: 'Русский Russian' },
  { value: 'portuguese', label: 'Português Portuguese' },
  { value: 'arabic', label: 'العربية Arabic' },
];

const SAMPLE_TEXT =
  'Cloudflare Workers AI lets developers run machine learning models on the edge.';

export function AiTranslationCard() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [sourceLang, setSourceLang] = useState<Language>('english');
  const [targetLang, setTargetLang] = useState<Language>('chinese');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  function onSwap() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInput(translation || input);
    setTranslation('');
  }

  async function onTranslate() {
    setError(undefined);
    setTranslation('');
    setIsPending(true);
    try {
      const result = await translateText({
        data: { text: input, sourceLang, targetLang },
      });
      setTranslation(result.translatedText);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to translate text.'
      );
    } finally {
      setIsPending(false);
    }
  }

  const sameLang = sourceLang === targetLang;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconLanguage className="size-5 text-primary" />
          Translation
        </CardTitle>
        <CardDescription>
          Powered by Cloudflare Workers AI{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            @cf/meta/m2m100-1.2b
          </code>{' '}
          to translate text across many languages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Select
              value={sourceLang}
              onValueChange={(value) => {
                if (value) setSourceLang(value as Language);
              }}
            >
              <SelectTrigger className="w-44" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-0.5 shrink-0"
            onClick={onSwap}
            aria-label="Swap languages"
          >
            <IconArrowsExchange className="size-4" />
          </Button>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Select
              value={targetLang}
              onValueChange={(value) => {
                if (value) setTargetLang(value as Language);
              }}
            >
              <SelectTrigger className="w-44" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai-translation-input">Source text</Label>
            <Textarea
              id="ai-translation-input"
              rows={6}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type or paste text to translate..."
            />
            <p className="text-xs text-muted-foreground">
              {input.length} characters
            </p>
            <Button
              type="button"
              onClick={onTranslate}
              disabled={isPending || sameLang || input.trim().length === 0}
            >
              {isPending ? (
                <>
                  <IconLoader2 className="mr-1 size-4 animate-spin" />
                  Translating...
                </>
              ) : (
                'Translate'
              )}
            </Button>
            {sameLang && (
              <p className="text-xs text-destructive">
                Source and target languages must be different.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Translation</Label>
            <div className="min-h-[160px] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : translation ? (
                translation
              ) : (
                <span className="text-muted-foreground">
                  The translation will appear here.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
