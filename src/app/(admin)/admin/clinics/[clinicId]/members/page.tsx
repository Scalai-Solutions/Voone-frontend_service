import { redirect } from "next/navigation";

import { MembersTable } from "@/components/dashboard/members-table";
import { PageHeader } from "@/components/shared/page-kit";
import { StaffScopeProvider } from "@/features/members/staff-scope";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

/** The clinic dashboard's members screen, for one clinic, inside the admin portal. */
export default async function ClinicMembersPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/members">) {
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
        eyebrow="Miembros"
        title={clinic.name}
        description="Los mismos miembros, fichas, visitas y premios que ve el centro en su panel."
        action={{
          href: `/admin/clinics/${encodeURIComponent(clinic.id)}`,
          label: "Volver al centro",
        }}
      />
      {/* The clinic routes answer only for an active centre. */}
      {clinic.isActive ? (
        <StaffScopeProvider clinicId={clinic.id}>
          <MembersTable />
        </StaffScopeProvider>
      ) : (
        <p className="rounded-lg border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
          Activa el centro para ver y gestionar sus miembros.
        </p>
      )}
    </div>
  );
}
