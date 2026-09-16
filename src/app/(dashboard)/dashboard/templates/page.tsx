import { redirect } from "next/navigation";

import { TemplateLandingGate } from "@/components/dashboard/template-chooser";
import { PageHeader } from "@/components/shared/page-kit";
import { getCurrentClinicTemplate } from "@/lib/api-client";
import { getCurrentSession, hasRole } from "@/lib/auth";

export default async function TemplatesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const canEdit = hasRole(session, ["owner", "manager"]);
  const initialTemplate = await getCurrentClinicTemplate(session.clinicId);

  if (initialTemplate) {
    redirect(`/dashboard/templates/${initialTemplate.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plantillas"
        title="Plantillas Wallet"
        description="Elige el diseño inicial del pase de la clínica y después ajusta la plantilla en el editor."
      />

      <TemplateLandingGate clinicId={session.clinicId} canEdit={canEdit} initialTemplate={initialTemplate} />
    </div>
  );
}