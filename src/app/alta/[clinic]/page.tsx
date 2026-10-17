import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError, getPublicClinic, type PublicClinic } from "@/lib/api-client";
import { SignupForm } from "./signup-form";

/**
 * The public sign-up page, reached by scanning a clinic's QR poster.
 *
 * Unauthenticated by design, and outside the (dashboard)/(admin) route groups so it picks up
 * neither role gate. src/proxy.ts only matches /dashboard and /admin, so no change there.
 */

const loadClinic = async (slug: string): Promise<PublicClinic> => {
  try {
    return await getPublicClinic(slug);
  } catch (error) {
    // A 404 is the only thing shown as "this link does not work". The backend collapses an
    // unknown slug, a malformed one and an inactive clinic into that one status precisely so
    // this page cannot be used to probe which clinics exist, and that is preserved here.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    // Anything else — the API unreachable, a 500 — is our fault, not a dead poster. Telling
    // someone standing at reception that their QR expired would send them to ask for a new
    // one that would not help. Rethrown for the error boundary, which says to try again.
    // This distinction leaks nothing: every non-existent slug still answers 404.
    throw error;
  }
};

export async function generateMetadata({
  params,
}: PageProps<"/alta/[clinic]">): Promise<Metadata> {
  const { clinic: slug } = await params;

  try {
    const clinic = await getPublicClinic(slug);

    return {
      title: `Únete a ${clinic.template.programName}`,
      description: clinic.template.benefitsText,
      // A membership form has nothing to gain from search traffic, and indexing one page
      // per clinic would leak the client list.
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Voone", robots: { index: false, follow: false } };
  }
}

const formatBrandName = (clinicName: string): string => {
  const trimmed = clinicName.trim();
  const withoutClinicSuffix = trimmed.replace(/\s+(clinic|clínica)$/i, "").trim();

  return (withoutClinicSuffix || trimmed).toUpperCase();
};

export default async function ClinicSignupPage({ params }: PageProps<"/alta/[clinic]">) {
  const { clinic: slug } = await params;
  const clinic = await loadClinic(slug);
  const brandName = formatBrandName(clinic.name);
  const displayBrandName = brandName.toLocaleLowerCase("es-ES").replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es-ES"));

  return (
    <main className="min-h-dvh bg-[#f5efe7] text-[#22201e]">
      <section className="relative isolate mx-auto flex min-h-dvh w-full max-w-none flex-col overflow-hidden bg-[#f7f1e9] px-6 pb-7 pt-12 sm:min-h-[893px] sm:max-w-[390px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_6%,rgba(226,202,170,0.3),transparent_24%),linear-gradient(180deg,#fbfaf7_0%,#f5efe7_48%,#f4eee6_100%)]" />
        <div className="pointer-events-none absolute left-[-36px] top-[365px] h-[470px] w-[92px] rounded-full bg-[#efe3d4] blur-2xl" />
        <div className="pointer-events-none absolute right-[-54px] top-[350px] h-[560px] w-[108px] rounded-full bg-[#d8c7b5] opacity-75 blur-2xl" />

        <header className="text-center">
          <p className="font-serif text-[1.55rem] font-semibold uppercase leading-none tracking-[0.09em] text-[#26231f]">
            {brandName}
          </p>
          <p className="mt-5 text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-[#8f877e]">
            {clinic.name} · Privé membership
          </p>
        </header>

        <div className="mt-14 text-center">
          <h1 className="font-serif text-[3.05rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[#24211f]">
            El privilegio de
            <br />
            cuidarte.
          </h1>
          <p className="mx-auto mt-6 max-w-[288px] text-[0.82rem] leading-6 tracking-[-0.01em] text-[#8b8379]">
            Prioridad, privilegios y momentos extraordinarios. Todo lo que mereces, en un solo pase.
          </p>
        </div>

        <SignupForm clinic={clinic} />

        <p className="mt-7 text-center text-[0.76rem] text-[#9a9086]">
          Una experiencia {displayBrandName}, diseñada para ti.
        </p>
      </section>
    </main>
  );
}
