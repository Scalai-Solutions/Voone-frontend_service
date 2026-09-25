import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { AdminTemplateGallery } from "@/components/admin/template-studio";
import { PageHeader } from "@/components/shared/page-kit";
import { getVooneTemplates } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminTemplateDesignsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.vooneTemplates(),
    queryFn: getVooneTemplates,
  });
  const templates =
    queryClient.getQueryData<Awaited<ReturnType<typeof getVooneTemplates>>>(
      queryKeys.vooneTemplates(),
    ) ?? (await getVooneTemplates());

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Voone template library"
        title="Template Designs"
        description="Create reusable Wallet designs with their own buttons, labels, images, and text modules. Clinics can use these designs when their Wallet class is provisioned."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminTemplateGallery templates={templates} />
      </HydrationBoundary>
    </div>
  );
}
