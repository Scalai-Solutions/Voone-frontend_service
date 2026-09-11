import { ClinicForm } from "@/components/admin/clinic-form";
import { PageHeader } from "@/components/shared/page-kit";

export default function NewClinicPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tenants" title="Onboard clinic" description="Create the clinic record, then jump into its first wallet template." />
      <ClinicForm />
    </div>
  );
}