import { TagsManager } from '@/components/admin/prompts/dictionary-manager';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/tags')({
  component: AdminTagsPage,
});

function AdminTagsPage() {
  const breadcrumbs = [
    { label: messages.admin.title, isCurrentPage: false },
    { label: '标签管理', isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <TagsManager />
        </div>
      </div>
    </>
  );
}
