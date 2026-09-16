import { MemberForm } from "@/components/dashboard/member-form";
import { PageHeader } from "@/components/shared/page-kit";
import { getCurrentSession } from "@/lib/auth";

export default async function NewMemberPage() {
  const session = await getCurrentSession();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros" title="Añadir miembro" description="Da de alta a una clienta en recepción. También puede darse de alta ella misma escaneando el código QR." />
      {session?.clinicSlug ? (
        <MemberForm clinicSlug={session.clinicSlug} />
      ) : (
        <p className="text-sm text-muted-foreground">No se ha podido identificar la clínica.</p>
      )}
    </div>
  );
}