import { OnboardingWizard } from "@/components/admin/onboarding-wizard";
import { getTemplatePresets, getVooneTemplates } from "@/lib/api-client";

export default async function NewOnboardingPage() {
  const [presets, templates] = await Promise.all([
    getTemplatePresets(),
    getVooneTemplates(),
  ]);

  return <OnboardingWizard presets={presets} templates={templates} />;
}
