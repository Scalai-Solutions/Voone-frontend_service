import { notFound } from "next/navigation";

import { TemplateForm } from "@/components/dashboard/template-form";
import { getTemplate, getTemplatePresets } from "@/lib/api-client";
import { getCurrentSession } from "@/lib/auth";

export default async function EditTemplatePage({ params }: PageProps<"/dashboard/templates/[templateId]">) {
  const [{ templateId }, session] = await Promise.all([params, getCurrentSession()]);

  if (templateId === "new") notFound();
  if (!session) notFound();

  const [template, presets] = await Promise.all([getTemplate(templateId), getTemplatePresets()]);

  return (
    <TemplateForm key={template.id} clinicId={session.clinicId} initialTemplate={template} presets={presets} />
  );
}