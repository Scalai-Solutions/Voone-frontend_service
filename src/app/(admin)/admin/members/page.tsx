import { AdminMemberSearch } from "@/components/admin/member-search";
import { PageHeader } from "@/components/shared/page-kit";

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Soporte" title="Buscar miembros" description="Consulta de solo lectura para solicitudes de soporte en todas las clínicas." />
      <AdminMemberSearch />
    </div>
  );
}