import { MemberForm } from "@/components/dashboard/member-form";
import { PageHeader } from "@/components/shared/page-kit";

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros" title="Añadir miembro" description="Da de alta a una clienta en recepción. También puede darse de alta ella misma escaneando el código QR." />
      <MemberForm />
    </div>
  );
}