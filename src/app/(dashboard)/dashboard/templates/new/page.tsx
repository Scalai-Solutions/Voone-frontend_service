import { redirect } from "next/navigation";

import { TemplateForm } from "@/components/dashboard/template-form";
import { PageHeader } from "@/components/shared/page-kit";
import { getCurrentClinicTemplate, getTemplatePresets } from "@/lib/api-client";
import { getCurrentSession } from "@/lib/auth";

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<{ presetId?: string | string[] }> }) {
  const [session, query] = await Promise.all([getCurrentSession(), searchParams]);

  if (!session) {
    redirect("/login");
  }

  const [currentTemplate, presets] = await Promise.all([getCurrentClinicTemplate(session.clinicId), getTemplatePresets()]);

  if (currentTemplate) {
    redirect(`/dashboard/templates/${currentTemplate.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Nueva plantilla" title="Crear pase Wallet" description="Selecciona un punto de partida y define el programa de puntos de la clínica." />
      <TemplateForm clinicId={session.clinicId} presets={presets} selectedPresetId={typeof query.presetId === "string" ? query.presetId : undefined} />
    </div>
  );
}