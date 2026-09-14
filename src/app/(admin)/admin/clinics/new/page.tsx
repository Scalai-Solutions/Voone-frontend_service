import { ClinicForm } from "@/components/admin/clinic-form";
import { PageHeader } from "@/components/shared/page-kit";

export default function NewClinicPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clientes" title="Dar de alta clínica" description="Crea la ficha de la clínica y después elige su plantilla Wallet." />
      <ClinicForm />
    </div>
  );
}