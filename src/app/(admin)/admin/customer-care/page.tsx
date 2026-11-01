import { ChangeRequestsInbox } from "@/components/admin/change-requests/inbox";
import { PageHeader } from "@/components/shared/page-kit";

export default function AdminCustomerCarePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Customer Care"
        description="Change requests from clinics: rewards, levels, services and session vouchers. Open a request to reply, apply it or close it."
      />
      <ChangeRequestsInbox />
    </div>
  );
}
