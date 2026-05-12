import { getAdminPrompt, listAdminModels, listAdminTags } from '@/api/prompts';
import { PromptForm } from '@/components/admin/prompts/prompt-form';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { messages } from '@/messages';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/prompts/$id/edit')({
  loader: async ({ params }) => {
    const [prompt, models, tags] = await Promise.all([
      getAdminPrompt({ data: { id: params.id } }),
      listAdminModels(),
      listAdminTags(),
    ]);
    if (!prompt) throw notFound();
    return { prompt, models, tags };
  },
  component: EditPromptPage,
});

function EditPromptPage() {
  const { prompt, models, tags } = Route.useLoaderData();
  const breadcrumbs = [
    { label: messages.admin.title, isCurrentPage: false },
    { label: '提示词管理', isCurrentPage: false },
    { label: '编辑提示词', isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <PromptForm prompt={prompt} models={models} tags={tags} />
        </div>
      </div>
    </>
  );
}
