import { ClinicsList } from "@/components/admin/clinics-list";
import { PageHeader } from "@/components/shared/page-kit";

export default function ClinicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tenants" title="Clinics" description="Find clinics, review setup state, and onboard new teams." />
      <ClinicsList />
    </div>
  );
}