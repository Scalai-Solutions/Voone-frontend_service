import Link from "next/link";
import { redirect } from "next/navigation";

import { MemberDetail } from "@/components/dashboard/member-detail";
import { PageHeader } from "@/components/shared/page-kit";
import { StaffScopeProvider } from "@/features/members/staff-scope";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

/** One member of one clinic, with everything reception can do, inside the admin portal. */
export default async function ClinicMemberDetailPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/members/[memberId]">) {
  const { clinicId, memberId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/clinics/${encodeURIComponent(clinic.id)}/members`}
        className="inline-flex text-sm font-semibold text-[#754b36] hover:text-[#2e2421]"
      >
        ← Volver a los miembros
      </Link>
      <PageHeader
        eyebrow={`Miembros · ${clinic.name}`}
        title="Detalle del miembro"
        description="Saldo actual, estado Wallet e historial reciente de puntos."
      />
      <StaffScopeProvider clinicId={clinic.id}>
        <MemberDetail memberId={memberId} />
      </StaffScopeProvider>
    </div>
  );
}
