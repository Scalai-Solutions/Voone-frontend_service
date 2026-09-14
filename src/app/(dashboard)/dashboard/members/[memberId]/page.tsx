import { MemberDetail } from "@/components/dashboard/member-detail";
import { PageHeader } from "@/components/shared/page-kit";

export default async function MemberDetailPage({ params }: PageProps<"/dashboard/members/[memberId]">) {
  const { memberId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros" title="Detalle del miembro" description="Saldo actual, estado Wallet e historial reciente de puntos." />
      <MemberDetail memberId={memberId} />
    </div>
  );
}