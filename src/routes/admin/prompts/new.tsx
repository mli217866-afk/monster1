import { listAdminModels, listAdminTags } from '@/api/prompts';
import { PromptForm } from '@/components/admin/prompts/prompt-form';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/prompts/new')({
  loader: async () => {
    const [models, tags] = await Promise.all([
      listAdminModels(),
      listAdminTags(),
    ]);
    return { models, tags };
  },
  component: NewPromptPage,
});

function NewPromptPage() {
  const { models, tags } = Route.useLoaderData();
  const breadcrumbs = [
    { label: messages.admin.title, isCurrentPage: false },
    { label: '提示词管理', isCurrentPage: false },
    { label: '新建提示词', isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <PromptForm models={models} tags={tags} />
        </div>
      </div>
    </>
  );
}
