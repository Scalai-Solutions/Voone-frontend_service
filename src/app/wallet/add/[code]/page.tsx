import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, ShieldCheck, WalletCards } from "lucide-react";

import type { Member, MemberPassWallet } from "@/lib/api-client";

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
  const googleUrl = payload.wallet.passes.google.url;
  const appleUrl = payload.wallet.passes.apple.url ?? `/api/wallet/passes/${encodeURIComponent(code)}/apple`;

  return (
    <main className="min-h-svh bg-[#f5efe7] px-4 py-4 text-[#2b241f] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-[#e3d4c8] bg-[#fffaf4] shadow-[0_28px_80px_rgba(58,39,29,0.18)]">
        <div className="relative min-h-[190px] overflow-hidden bg-[#ecd0bf] px-5 pb-5 pt-6 text-[#352821]">
          <Image
            src="/wallet/sapphira-hero.png"
            alt=""
            fill
            priority
            sizes="430px"
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,244,0.16),rgba(255,250,244,0.78)_74%,#fffaf4)]" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/55 bg-white/70 text-[#7a5846] shadow-sm backdrop-blur">
              <WalletCards size={24} />
            </span>
            <span className="rounded-full border border-white/55 bg-white/72 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f5549] backdrop-blur">
              Pase Wallet
            </span>
          </div>
        </div>

        <div className="-mt-10 flex flex-1 flex-col px-5 pb-5">
          <div className="relative rounded-[26px] border border-[#eadbd0] bg-white/92 p-5 shadow-[0_18px_45px_rgba(70,47,34,0.12)] backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b48355]">{payload.clinic.name}</p>
            <h1 className="mt-3 font-serif text-[2.35rem] font-semibold leading-none tracking-[-0.035em] text-[#2d211c]">
              {payload.member.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#7d695e]">
              Añade tu pase al Wallet de este móvil para identificarte en recepción y recibir tus puntos.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#eadbd0] bg-[#fff8f1] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a57a55]">Saldo</p>
                <p className="mt-2 text-lg font-semibold">{payload.member.points.toLocaleString("es-ES")}</p>
                <p className="text-xs text-[#8b7569]">puntos</p>
              </div>
              <div className="rounded-2xl border border-[#eadbd0] bg-[#fff8f1] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a57a55]">Nivel</p>
                <p className="mt-2 text-lg font-semibold">{payload.member.tier}</p>
                <p className="text-xs text-[#8b7569]">miembro</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#e8d9ce] bg-[#fffdf9] p-4">
            <p className="mb-3 text-center text-sm font-semibold text-[#5a463d]">Guardar pase</p>
            <div className="flex flex-col items-center gap-3">
              {googleUrl ? (
                <Link href={googleUrl} className="inline-flex min-h-[55px] items-center justify-center rounded-full transition duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1a73e8]" rel="noopener noreferrer">
                  <Image src="/wallet/add-to-google-wallet-es.svg" alt="Añadir a Google Wallet" width={199} height={55} priority className="h-[55px] w-auto" />
                </Link>
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-[#d8c8bc] px-4 py-3 text-center text-sm text-[#806d63]">Google Wallet no está disponible para este pase.</div>
              )}

              {payload.wallet.passes.apple.available ? (
                <Link href={appleUrl} className="inline-flex min-h-[48px] items-center justify-center rounded-xl transition duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#0a84ff]" rel="noopener noreferrer">
                  <Image src="/wallet/ES_Add_to_Apple_Wallet_RGB_101921.svg" alt="Añadir a Apple Wallet" width={133} height={35} className="h-[44px] w-auto" />
                </Link>
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-[#d8c8bc] px-4 py-3 text-center text-sm text-[#806d63]">Apple Wallet no está disponible para este pase.</div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-5">
            <div className="rounded-2xl border border-[#eadfd8] bg-[#fff7ef] p-4 text-sm leading-6 text-[#735f55]">
              <Mail className="mr-2 inline h-4 w-4 text-[#b7874a]" />
              Abre este enlace desde el teléfono donde quieres guardar el pase.
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-[#8b7569]">
              <ShieldCheck className="h-4 w-4 text-[#9f7654]" /> Enlace seguro y personal
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
