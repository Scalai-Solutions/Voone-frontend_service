import { AdminMemberSearch } from "@/components/admin/member-search";
import { PageHeader } from "@/components/shared/page-kit";

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Support" title="Member search" description="Read-only lookup for support requests across clinics." />
      <AdminMemberSearch />
    </div>
  );
}