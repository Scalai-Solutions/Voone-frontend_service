import { redirect } from "next/navigation";

import { ClinicCredentialsActions } from "@/components/admin/clinic-account-actions";
import { ClinicSetupFlow } from "@/components/admin/clinic-setup-flow";
import { PageHeader } from "@/components/shared/page-kit";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";

export default async function ClinicSetupPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });
  const credentials = clinic.onboardingCredentials;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title={clinic.name}
        description="Finish setting up the center. Everything saves as you go."
        action={{ href: `/admin/clinics/${encodeURIComponent(clinic.id)}`, label: "Back to center" }}
      />
      <ClinicSetupFlow
        clinicId={clinic.id}
        clinicName={clinic.name}
        alreadyActive={clinic.isActive}
        hasCard={Boolean(clinic.template)}
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
          />
        }
      />
    </div>
  );
}
