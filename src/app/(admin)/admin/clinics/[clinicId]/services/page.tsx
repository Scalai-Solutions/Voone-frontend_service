import { redirect } from "next/navigation";

import { BonoPlansAdminEditor } from "@/components/admin/services/bono-plans-admin-editor";
import { TreatmentsAdminEditor } from "@/components/admin/services/treatments-admin-editor";
import { PageHeader } from "@/components/shared/page-kit";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

export default async function ClinicServicesPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/services">) {
  const { clinicId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Services"
        title={clinic.name}
        description="Treatments and session vouchers. Clinic owners cannot edit these themselves: they send a request, and approved changes can be applied from the request itself. Use this page for changes that do not come from a request."
        action={{
          href: `/admin/clinics/${encodeURIComponent(clinic.id)}`,
          label: "Back to center",
        }}
      />
      <TreatmentsAdminEditor clinicId={clinic.id} />
      <BonoPlansAdminEditor clinicId={clinic.id} />
    </div>
  );
}
