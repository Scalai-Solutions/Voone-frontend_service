import { MemberForm } from "@/components/dashboard/member-form";
import { PageHeader } from "@/components/shared/page-kit";

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Members" title="Add member" description="Create the pass and share it without asking the client to type anything." />
      <MemberForm />
    </div>
  );
}