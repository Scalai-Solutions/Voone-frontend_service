import { redirect } from "next/navigation";

import { MemberDetail } from "@/components/dashboard/member-detail";
import { PageHeader } from "@/components/shared/page-kit";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function MemberDetailPage({ params }: PageProps<"/dashboard/members/[memberId]">) {
  const [session, { memberId }] = await Promise.all([getCurrentSession(), params]);

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, PERMISSIONS.membersManage)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros" title="Detalle del miembro" description="Saldo actual, estado Wallet e historial reciente de puntos." />
      <MemberDetail memberId={memberId} />
    </div>
  );
}
