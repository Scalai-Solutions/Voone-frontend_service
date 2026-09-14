import { MemberForm } from "@/components/dashboard/member-form";
import { PageHeader } from "@/components/shared/page-kit";

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros" title="Añadir miembro" description="Crea el pase y compártelo sin pedir al cliente que escriba nada." />
      <MemberForm />
    </div>
  );
}