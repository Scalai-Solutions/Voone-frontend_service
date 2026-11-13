import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupQrPanel } from "@/components/dashboard/signup-qr-panel";
import { PageHeader } from "@/components/shared/page-kit";
import { getAdminClinic } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { getClinicSignupUrl } from "@/lib/app-url";

/**
 * "Añadir persona" from the admin's members list: as on the clinic dashboard, a member signs up
 * themselves from the clinic's public sign-up page; nobody types their details in for them.
 */
export default async function ClinicNewMemberPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/members/new">) {
  const { clinicId } = await params;
  const clinic = await getAdminClinic(clinicId).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      redirect("/admin/clinics");
    }

    throw error;
  });
  const signupUrl = await getClinicSignupUrl(clinic.slug);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Miembros · ${clinic.name}`}
        title="Alta por QR"
        description="El cliente completa sus datos desde su móvil y recibe los botones para Apple Wallet y Google Wallet al terminar."
        action={{
          href: `/admin/clinics/${encodeURIComponent(clinic.id)}/members`,
          label: "Volver a los miembros",
        }}
      />
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <SignupQrPanel signupUrl={signupUrl} />
        <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-6 text-[#2e2421]">
          <h2 className="font-serif text-3xl font-semibold">No introduzcas datos por el cliente</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#806d63]">
            Comparte el QR o el enlace de alta del centro. El formulario público recoge nombre, móvil,
            año de nacimiento, sexo y consentimiento, y después muestra los botones de Wallet.
          </p>
          <Link
            href={signupUrl}
            className="mt-5 inline-flex rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white"
          >
            Abrir alta pública
          </Link>
        </section>
      </div>
    </div>
  );
}
