import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { TemplateForm } from "@/components/dashboard/template-form";
import { getCurrentClinicTemplate, getTemplatePresets } from "@/lib/api-client";
import { getCurrentSession } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<{ presetId?: string | string[] }> }) {
  const [session, query] = await Promise.all([getCurrentSession(), searchParams]);

  if (!session) {
    redirect("/login");
  }

  const queryClient = new QueryClient();
  const [currentTemplate] = await Promise.all([
    getCurrentClinicTemplate(session.clinicId),
    queryClient.prefetchQuery({ queryKey: queryKeys.templatePresets(), queryFn: getTemplatePresets }),
  ]);
  const presets = queryClient.getQueryData<Awaited<ReturnType<typeof getTemplatePresets>>>(queryKeys.templatePresets()) ?? await getTemplatePresets();

  if (currentTemplate) {
    redirect(`/dashboard/templates/${currentTemplate.id}`);
  }

  return (
    <div className="space-y-3">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Nueva plantilla</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-[-0.02em] text-[#2e2421]">Crear pase Wallet</h1>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TemplateForm clinicId={session.clinicId} presets={presets} selectedPresetId={typeof query.presetId === "string" ? query.presetId : undefined} />
      </HydrationBoundary>
    </div>
  );
}