import { redirect } from "next/navigation";

import { ChangeRequestsInbox } from "@/components/admin/change-requests/inbox";
import { PageHeader } from "@/components/shared/page-kit";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

export default async function ClinicRequestsPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/requests">) {
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
        eyebrow="Requests"
        title={clinic.name}
        description="Change requests this clinic has sent to Voone."
        action={{
          href: `/admin/clinics/${encodeURIComponent(clinic.id)}`,
          label: "Back to center",
        }}
      />
      <ChangeRequestsInbox clinicId={clinic.id} />
    </div>
  );
}
