import { notFound } from "next/navigation";

import { AdminTemplateEditor } from "@/components/admin/template-studio";
import { getTemplatePresets, getVooneTemplate } from "@/lib/api-client";

export default async function AdminTemplateEditorPage({
  params,
  searchParams,
}: PageProps<"/admin/templates/[templateId]">) {
  const [{ templateId }, query] = await Promise.all([params, searchParams]);
  const presets = await getTemplatePresets();

  if (templateId === "new") {
    const preset = typeof query.preset === "string" ? query.preset : undefined;
    return <AdminTemplateEditor presets={presets} selectedPresetId={preset} />;
  }

  const template = await getVooneTemplate(templateId);
  if (!template) notFound();

  return <AdminTemplateEditor template={template} presets={presets} />;
}
