import { CollectionsPage } from '@/components/prompt/collections-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/me/collections')({
  component: CollectionsPage,
});
