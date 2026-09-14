import { notFound } from "next/navigation";

import { TemplateForm } from "@/components/dashboard/template-form";
import { normalizeTemplateStarterId } from "@/components/dashboard/template-starters";
import { getTemplate } from "@/lib/api-client";

export default async function EditTemplatePage({ params, searchParams }: PageProps<"/dashboard/templates/[templateId]">) {
  const [{ templateId }, query] = await Promise.all([params, searchParams]);

  if (templateId === "new") notFound();

  const starter = normalizeTemplateStarterId(query.starter);
  const template = await getTemplate(templateId);

  return (
    <TemplateForm key={`${template.id}-${starter ?? "current"}`} initialTemplate={template} starter={starter} />
  );
}