import { AdminPromptsContent } from '@/components/admin/prompts/admin-prompts-content';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/prompts')({
  component: AdminPromptsPage,
});

function AdminPromptsPage() {
  const breadcrumbs = [
    { label: messages.admin.title, isCurrentPage: false },
    { label: '提示词管理', isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 lg:gap-6 lg:py-6">
            <div className="px-4 lg:px-6">
              <AdminPromptsContent />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
