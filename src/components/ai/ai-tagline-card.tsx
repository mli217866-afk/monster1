import { useState } from 'react';
import { IconLoader2, IconSparkles } from '@tabler/icons-react';
import { generateTaglines } from '@/api/ai';
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

const SAMPLE_PRODUCT =
  'A SaaS boilerplate built with TanStack Start, Cloudflare Workers, Better Auth, and Drizzle ORM. Helps indie developers ship a production-ready app over a weekend.';

export function AiTaglineCard() {
  const [product, setProduct] = useState(SAMPLE_PRODUCT);
  const [taglines, setTaglines] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  async function onGenerate() {
    setError(undefined);
    setTaglines([]);
    setIsPending(true);
    try {
      const result = await generateTaglines({ data: { product } });
      setTaglines(result.taglines);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate taglines.'
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
          SaaS Tagline Generator
        </CardTitle>
        <CardDescription>
          Powered by Cloudflare Workers AI{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            @cf/meta/llama-3.1-8b-instruct
          </code>{' '}
          to generate punchy SaaS taglines from a description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai-tagline-input">Product description</Label>
            <Textarea
              id="ai-tagline-input"
              rows={8}
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="Describe what your SaaS does in one or two sentences..."
            />
            <p className="text-xs text-muted-foreground">
              {product.length} characters
            </p>
            <Button
              type="button"
              onClick={onGenerate}
              disabled={isPending || product.trim().length < 10}
            >
              {isPending ? (
                <>
                  <IconLoader2 className="mr-1 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Taglines'
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Suggested taglines</Label>
            <div className="min-h-[208px] rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : taglines.length > 0 ? (
                <ol className="list-decimal space-y-2 pl-5">
                  {taglines.map((tagline) => (
                    <li key={tagline}>{tagline}</li>
                  ))}
                </ol>
              ) : (
                <span className="text-muted-foreground">
                  Five generated taglines will appear here.
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
