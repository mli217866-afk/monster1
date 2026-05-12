import { ModelsManager } from '@/components/admin/prompts/dictionary-manager';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/models')({
  component: AdminModelsPage,
});

function AdminModelsPage() {
  const breadcrumbs = [
    { label: messages.admin.title, isCurrentPage: false },
    { label: '模型管理', isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <ModelsManager />
        </div>
      </div>
    </>
  );
}
