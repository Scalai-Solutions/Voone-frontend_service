import { ClinicsList } from "@/components/admin/clinics-list";
import { PageHeader } from "@/components/shared/page-kit";

export default function ClinicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clients" title="Clinics" description="Search centers, review onboarding status, and open clinic details from the operating list." />
      <ClinicsList />
    </div>
  );
}