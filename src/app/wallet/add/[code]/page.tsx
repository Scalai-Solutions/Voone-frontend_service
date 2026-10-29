import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ShieldCheck } from "lucide-react";

import type { Member, MemberPassWallet } from "@/lib/api-client";
import { resolveWalletInstallUrl } from "@/lib/wallet-links";
import { formatPoints } from "@/lib/points";

interface WalletPassPagePayload {
  member: Member;
  clinic: { name: string };
  wallet: MemberPassWallet;
}

const resolveBaseUrl = (): string => {
  const base = process.env.VOONE_API_URL ?? process.env.NEXT_PUBLIC_VOONE_API_URL;

  if (!base) {
    throw new Error("VOONE_API_URL or NEXT_PUBLIC_VOONE_API_URL must be configured");
  }

  return base.replace(/\/$/, "");
};

const formatBrandName = (clinicName: string): string => {
  const trimmed = clinicName.trim();
  const withoutClinicSuffix = trimmed.replace(/\s+(clinic|clínica)$/i, "").trim();

  return (withoutClinicSuffix || trimmed).toUpperCase();
};

async function getWalletPass(code: string): Promise<WalletPassPagePayload> {
  const response = await fetch(`${resolveBaseUrl()}/v1/wallet/passes/${encodeURIComponent(code)}`, {
    cache: "no-store",
  });

  if (response.status === 404) notFound();

  if (!response.ok) {
    throw new Error("Could not load wallet pass");
  }

  return response.json() as Promise<WalletPassPagePayload>;
}

export default async function WalletAddPage(context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const payload = await getWalletPass(code);
  const googleUrl = resolveWalletInstallUrl(payload.wallet.passes.google);
  const appleUrl = resolveWalletInstallUrl(payload.wallet.passes.apple);
  const clinicName = payload.clinic.name.trim();
  const brandName = formatBrandName(clinicName);
  const displayBrandName = brandName.toLocaleLowerCase("es-ES").replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es-ES"));

  return (
    <main className="min-h-svh bg-[#f5efe7] text-[#22201e]">
      <section className="relative isolate mx-auto flex min-h-svh w-full max-w-none flex-col overflow-hidden px-6 pb-7 pt-12 sm:my-6 sm:min-h-[893px] sm:max-w-[390px] sm:rounded-[38px] sm:border sm:border-[#e7ded2] sm:shadow-[0_30px_90px_rgba(64,48,37,0.16)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_6%,rgba(226,202,170,0.28),transparent_24%),linear-gradient(180deg,#fbfaf7_0%,#f5efe7_48%,#f4eee6_100%)]" />
        <div className="pointer-events-none absolute left-[-34px] top-[365px] h-[470px] w-[92px] rounded-full bg-[#efe3d4] blur-2xl" />
        <div className="pointer-events-none absolute right-[-50px] top-[350px] h-[560px] w-[108px] rounded-full bg-[#d8c7b5] opacity-75 blur-2xl" />

        <header className="text-center">
          <p className="font-serif text-[1.65rem] font-semibold uppercase leading-none tracking-[0.09em] text-[#26231f]">
            {brandName}
          </p>
          <p className="mt-5 text-[0.58rem] font-semibold uppercase tracking-[0.25em] text-[#8f877e]">
            {clinicName} · Membresía
          </p>
        </header>

        <div className="mt-14 text-center">
          <h1 className="font-serif text-[3.22rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[#24211f]">
            El privilegio de
            <br />
            cuidarte.
          </h1>
          <p className="mx-auto mt-6 max-w-[288px] text-[0.84rem] leading-6 tracking-[-0.01em] text-[#8b8379]">
            Prioridad, privilegios y momentos extraordinarios. Todo lo que mereces, en un solo pase.
          </p>
        </div>

        <div className="relative mt-16 flex-1 rounded-[36px] border border-[#eee5da] bg-[#fffbf7]/86 px-7 pb-7 pt-19 shadow-[0_28px_70px_rgba(55,42,32,0.12)] backdrop-blur-xl">
          <div className="text-center">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[#9b927f]">{clinicName}</p>
            <h2 className="mt-7 font-serif text-[1.95rem] font-semibold leading-none tracking-[-0.045em] text-[#24211f]">
              Tu pase está listo
            </h2>
            <p className="mx-auto mt-4 max-w-[286px] text-[0.86rem] leading-6 text-[#7d746b]">
              Añádelo a tu Wallet para identificarte en recepción y empezar a disfrutar de tus privilegios.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="mb-4 text-[0.78rem] font-semibold text-[#403a35]">Guardar pase</p>
            <div className="flex flex-col items-center gap-3">
              {googleUrl ? (
                <Link href={googleUrl} className="inline-flex min-h-[45px] items-center justify-center rounded-[14px] transition duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1a73e8]" rel="noopener noreferrer">
                  <Image src="/wallet/add-to-google-wallet-es.svg" alt="Añadir a Google Wallet" width={199} height={55} priority className="h-[45px] w-auto" />
                </Link>
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-[#d8c8bc] px-4 py-3 text-center text-sm text-[#806d63]">Google Wallet no está disponible para este pase.</div>
              )}

              {appleUrl ? (
                <Link href={appleUrl} className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] transition duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#0a84ff]" rel="noopener noreferrer">
                  <Image src="/wallet/ES_Add_to_Apple_Wallet_RGB_101921.svg" alt="Añadir a Apple Wallet" width={133} height={35} className="h-[44px] w-auto" />
                </Link>
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-[#d8c8bc] px-4 py-3 text-center text-sm text-[#806d63]">Apple Wallet no está disponible para este pase. Pídeselo al equipo de recepción.</div>
              )}
            </div>
          </div>

          <details className="group mx-auto mt-9 max-w-[248px] text-left">
            <summary className="flex cursor-pointer list-none items-start gap-3 text-[#2d2824] outline-none transition hover:text-[#8a6f4f] focus-visible:rounded-2xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c5a26e] [&::-webkit-details-marker]:hidden">
              <span className="flex-1 text-center">
                <span className="block text-[0.86rem] font-semibold">Ver mi pase completo</span>
                <span className="mt-1 block text-[0.6rem] leading-4 text-[#9a9086]">Consulta tus datos y beneficios</span>
              </span>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[#958779] transition group-open:rotate-180" aria-hidden />
            </summary>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-[22px] border border-[#eee4d9] bg-[#fffaf4] p-3 text-center shadow-[inset_0_1px_rgba(255,255,255,0.85)]">
              <div className="col-span-2 rounded-2xl bg-[#f7efe6] px-3 py-2">
                <dt className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#a09688]">Miembro</dt>
                <dd className="mt-1 font-serif text-lg leading-tight text-[#2e2924]">{payload.member.name}</dd>
              </div>
              <div className="rounded-2xl bg-[#f7efe6] px-3 py-2">
                <dt className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[#a09688]">Puntos</dt>
                <dd className="mt-1 text-sm font-semibold text-[#2e2924]">{formatPoints(payload.member.points)}</dd>
              </div>
              <div className="rounded-2xl bg-[#f7efe6] px-3 py-2">
                <dt className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[#a09688]">Nivel</dt>
                <dd className="mt-1 text-sm font-semibold text-[#2e2924]">{payload.member.tier}</dd>
              </div>
            </dl>
          </details>

          <p className="mt-8 flex items-center justify-center gap-2 text-[0.82rem] font-semibold text-[#3e3934]">
            <ShieldCheck className="h-4 w-4 text-[#9f8b69]" aria-hidden />
            Acceso privado y seguro
          </p>
          <p className="mt-2 text-center text-[0.72rem] text-[#9a9086]">Tu información está protegida</p>
        </div>

        <p className="mt-7 text-center text-[0.78rem] text-[#9a9086]">
          Una experiencia {displayBrandName}, diseñada para ti.
        </p>
      </section>
    </main>
  );
}
