import { MemberDetail } from "@/components/dashboard/member-detail";
import { PageHeader } from "@/components/shared/page-kit";

export default async function MemberDetailPage({ params }: PageProps<"/dashboard/members/[memberId]">) {
  const { memberId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Members" title="Member detail" description="Current balance, wallet status, and recent point history." />
      <MemberDetail memberId={memberId} />
    </div>
  );
}