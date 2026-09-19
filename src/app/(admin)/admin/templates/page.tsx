import { AdminTemplateGallery } from "@/components/admin/template-studio";
import { PageHeader } from "@/components/shared/page-kit";
import { getTemplatePresets, getTemplates } from "@/lib/api-client";

export default async function AdminTemplateDesignsPage() {
  const [templates, presets] = await Promise.all([getTemplates(), getTemplatePresets()]);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader eyebrow="Template library" title="Template Designs" description="Three editable Wallet pass directions for clinic onboarding and program launches." />
      <AdminTemplateGallery templates={templates} presets={presets} />
    </div>
  );
}
