import { OnboardingWizard } from "@/components/admin/onboarding-wizard";
import { getTemplatePresets } from "@/lib/api-client";

export default async function NewOnboardingPage() {
  const presets = await getTemplatePresets();

  return <OnboardingWizard presets={presets} />;
}
