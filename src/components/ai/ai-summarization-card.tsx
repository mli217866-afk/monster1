import { useState } from 'react';
import { IconLoader2, IconWand } from '@tabler/icons-react';
import { summarizeText } from '@/api/ai';
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

const SAMPLE_TEXT = `Cloudflare Workers AI lets developers run machine learning models on the Cloudflare global network. It provides a serverless GPU-powered inference platform that brings popular open-source models close to end users without managing any infrastructure. Combined with Cloudflare AI Gateway, teams gain caching, analytics, rate limiting, and unified billing across many AI providers, making it easy to ship reliable AI features in production.`;

export function AiSummarizationCard() {
  const [input, setInput] = useState(SAMPLE_TEXT.trim());
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  async function onGenerate() {
    setError(undefined);
    setSummary('');
    setIsPending(true);
    try {
      const result = await summarizeText({ data: { text: input } });
      setSummary(result.summary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to summarize text.'
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWand className="size-5 text-primary" />
          Summarization
        </CardTitle>
        <CardDescription>
          Powered by Cloudflare Workers AI{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            @cf/facebook/bart-large-cnn
          </code>{' '}
          to condense long text into a concise summary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai-summarization-input">Source content</Label>
            <Textarea
              id="ai-summarization-input"
              rows={10}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste a long article or paragraph here..."
            />
            <p className="text-xs text-muted-foreground">
              {input.length} characters
            </p>
            <Button
              type="button"
              onClick={onGenerate}
              disabled={isPending || input.trim().length < 50}
            >
              {isPending ? (
                <>
                  <IconLoader2 className="mr-1 size-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                'Summarize'
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <div className="min-h-[256px] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : summary ? (
                summary
              ) : (
                <span className="text-muted-foreground">
                  The summary will appear here.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
