import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { TemplateForm } from "@/components/dashboard/template-form";
import { getTemplate, getTemplatePresets } from "@/lib/api-client";
import { getCurrentSession } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";

export default async function EditTemplatePage({ params }: PageProps<"/dashboard/templates/[templateId]">) {
  const [{ templateId }, session] = await Promise.all([params, getCurrentSession()]);

  if (templateId === "new") notFound();
  if (!session) notFound();

  const queryClient = new QueryClient();
  const [template] = await Promise.all([
    getTemplate(templateId),
    queryClient.prefetchQuery({ queryKey: queryKeys.templatePresets(), queryFn: getTemplatePresets }),
  ]);
  const presets = queryClient.getQueryData<Awaited<ReturnType<typeof getTemplatePresets>>>(queryKeys.templatePresets()) ?? await getTemplatePresets();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TemplateForm key={template.id} clinicId={session.clinicId} initialTemplate={template} presets={presets} />
    </HydrationBoundary>
  );
}