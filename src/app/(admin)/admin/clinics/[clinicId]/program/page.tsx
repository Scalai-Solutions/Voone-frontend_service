import { redirect } from "next/navigation";

import { ProgramSetup } from "@/components/admin/program/program-setup";
import { PageHeader } from "@/components/shared/page-kit";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

export default async function ClinicProgramPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/program">) {
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
        eyebrow="Programa de fidelización"
        title={clinic.name}
        description="Del catálogo del centro a un programa de niveles y premios, listo para activar."
        action={{ href: `/admin/clinics/${encodeURIComponent(clinic.id)}`, label: "Volver al centro" }}
      />
      <ProgramSetup clinicId={clinic.id} />
    </div>
  );
}
