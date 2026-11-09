import { redirect } from "next/navigation";

import { billingDraftFrom } from "@/components/billing/billing-fields";
import { ClinicCredentialsActions } from "@/components/admin/clinic-account-actions";
import { ClinicSetupFlow } from "@/components/admin/clinic-setup-flow";
import { PageHeader } from "@/components/shared/page-kit";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

export default async function ClinicSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ clinicId: string }>;
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const { clinicId } = await params;
  const { notice } = await searchParams;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });
  const credentials = clinic.onboardingCredentials;

  return (
    <div className="space-y-6">
      {notice === "google_pending" ? (
        <p
          role="status"
          className="rounded-2xl border border-[#e8cf9a] bg-[#fff7e7] p-4 text-sm text-[#7a5a1e]"
        >
          La tarjeta de Google Wallet todavía no se ha podido crear. Se
          reintentará la próxima vez que se guarde el diseño de la tarjeta.
        </p>
      ) : null}
      <PageHeader
        eyebrow="Alta"
        title={clinic.name}
        description="Termina de configurar el centro. Todo se guarda sobre la marcha."
        action={{
          href: `/admin/clinics/${encodeURIComponent(clinic.id)}`,
          label: "Volver al centro",
        }}
      />
      <ClinicSetupFlow
        clinicId={clinic.id}
        clinicName={clinic.name}
        alreadyActive={clinic.isActive}
        hasCard={Boolean(clinic.template)}
        initialBilling={billingDraftFrom(clinic)}
        accountShared={Boolean(credentials?.hasPassword || credentials?.sentAt)}
        accountPanel={
          <ClinicCredentialsActions
            clinicId={clinic.id}
            email={credentials?.email}
            setupUrl={credentials?.setupUrl}
            setupTokenExpiresAt={credentials?.setupTokenExpiresAt}
            generatedAt={credentials?.generatedAt}
            sentAt={credentials?.sentAt}
            hasPassword={credentials?.hasPassword}
            setPasswordLink
          />
        }
      />
    </div>
  );
}
