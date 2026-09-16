import { ClinicForm } from "@/components/admin/clinic-form";
import { PageHeader } from "@/components/shared/page-kit";
import { getAppOrigin } from "@/lib/app-url";

export default async function NewClinicPage() {
  // Resolved on the server so the QR shown afterwards encodes the real public origin rather
  // than whatever host the operator happens to be browsing.
  const appOrigin = await getAppOrigin();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clientes" title="Dar de alta clínica" description="Crea la clínica y su plantilla. Al terminar tendrás el código QR para imprimir." />
      <ClinicForm appOrigin={appOrigin} />
    </div>
  );
}