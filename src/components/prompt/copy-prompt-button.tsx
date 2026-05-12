'use client';

import { Button } from '@/components/ui/button';
import { useCopyPrompt } from '@/hooks/use-prompts';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function CopyPromptButton({
  promptId,
  content,
  className,
  variant = 'default',
  size = 'default',
}: {
  promptId: string;
  content: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
}) {
  const [copied, setCopied] = useState(false);
  const copyMutation = useCopyPrompt();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        fallbackCopy(content);
      }
      setCopied(true);
      toast.success('已复制提示词');
      copyMutation.mutate(promptId);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('复制失败，请手动选择文本复制');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
    >
      {copied ? (
        <IconCheck className="size-4" />
      ) : (
        <IconCopy className="size-4" />
      )}
      {copied ? '已复制' : '复制'}
    </Button>
  );
}
