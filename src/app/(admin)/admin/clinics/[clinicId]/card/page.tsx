import { notFound, redirect } from "next/navigation";

import { TemplateForm } from "@/components/dashboard/template-form";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError, getTemplate, getTemplatePresets } from "@/lib/api-client";

/**
 * A Voone administrator editing one clinic's wallet card. The same editor the clinic's owner
 * uses, saving through the admin route for this clinic instead of through a clinic session.
 */
export default async function AdminClinicCardPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/card">) {
  const { clinicId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });

  if (!clinic.template) notFound();

  const [template, presets] = await Promise.all([
    getTemplate(clinic.template.id),
    getTemplatePresets(),
  ]);

  return (
    <TemplateForm
      key={template.id}
      scope="admin"
      clinicId={clinic.id}
      initialTemplate={template}
      presets={presets}
    />
  );
}
