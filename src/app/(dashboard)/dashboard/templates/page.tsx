import { TemplateChooser } from "@/components/dashboard/template-chooser";
import { PageHeader } from "@/components/shared/page-kit";
import { getTemplates } from "@/lib/api-client";
import { getCurrentSession, hasRole } from "@/lib/auth";

export default async function TemplatesPage() {
  const [templates, session] = await Promise.all([getTemplates(), getCurrentSession()]);
  const canEdit = hasRole(session, ["owner", "manager"]);
  const goldTemplate = templates.find((template) => template.id === "gold-beauty") ?? templates[0];
  const diamondTemplate = templates.find((template) => template.id === "diamond-skin") ?? templates[1] ?? goldTemplate;
  const scratchTemplate = goldTemplate ?? diamondTemplate;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Templates"
        title="Wallet templates"
        description="Choose the starting design for the clinic pass, then fine tune the selected template in the editor."
      />

      <TemplateChooser
        canEdit={canEdit}
        templateIds={{
          signatureGlow: goldTemplate?.id ?? "gold-beauty",
          diamondSkin: diamondTemplate?.id ?? "diamond-skin",
          scratch: scratchTemplate?.id ?? "gold-beauty",
        }}
      />
    </div>
  );
}