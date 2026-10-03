import Link from "next/link";

import { SignupQrPanel } from "@/components/dashboard/signup-qr-panel";
import { PageHeader } from "@/components/shared/page-kit";
import { getClinicSignupUrl } from "@/lib/app-url";
import { getCurrentStaffClinic } from "@/lib/current-clinic";

export default async function NewMemberPage() {
  const clinic = await getCurrentStaffClinic();
  const signupUrl = await getClinicSignupUrl(clinic.id);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros" title="Alta por QR" description="La clienta completa sus datos desde su móvil y recibe los botones para Apple Wallet y Google Wallet al terminar." />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {signupUrl ? <SignupQrPanel signupUrl={signupUrl} /> : null}
        <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-6 text-[#2e2421]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Recepción</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">No introduzcas datos por la clienta</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#806d63]">
            Usa el QR del mostrador o comparte el enlace de alta. El formulario público recoge nombre,
            móvil, año de nacimiento, sexo y consentimiento, y después muestra los botones de Wallet.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {signupUrl ? (
              <Link href={signupUrl} className="rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white">
                Abrir alta pública
              </Link>
            ) : null}
            <Link href="/dashboard/settings" className="rounded-full border border-[#cdb9aa] px-5 py-3 text-sm font-semibold text-[#754b36]">
              Ver QR en ajustes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}