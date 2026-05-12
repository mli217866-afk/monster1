import { CollectionDetailPage } from '@/components/prompt/collection-detail-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/me/collections/$id')({
  component: CollectionRoute,
});

function CollectionRoute() {
  const { id } = Route.useParams();
  return <CollectionDetailPage id={id} />;
}
