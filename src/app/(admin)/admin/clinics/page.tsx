import { ClinicsList } from "@/components/admin/clinics-list";
import { PageHeader } from "@/components/shared/page-kit";

export default function ClinicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clientes" title="Clínicas" description="Busca clínicas, revisa su estado de configuración y da de alta nuevos equipos." />
      <ClinicsList />
    </div>
  );
}