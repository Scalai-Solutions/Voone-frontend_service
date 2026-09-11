import { TemplateForm } from "@/components/dashboard/template-form";
import { getTemplate } from "@/lib/api-client";

export default async function EditTemplatePage({ params }: PageProps<"/dashboard/templates/[templateId]">) {
  const { templateId } = await params;
  const template = await getTemplate(templateId);

  return (
    <TemplateForm initialTemplate={template} />
  );
}