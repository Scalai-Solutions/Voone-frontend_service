import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError, getPublicClinic, type PublicClinic } from "@/lib/api-client";
import { readableInkOn } from "@/lib/contrast";

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

export default async function ClinicSignupPage({ params }: PageProps<"/alta/[clinic]">) {
  const { clinic: slug } = await params;
  const clinic = await loadClinic(slug);
  const { template } = clinic;
  const ink = readableInkOn(template.hexBackgroundColor);

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      {/* The clinic's own colour, with an ink guaranteed to clear AA against it — a fixed
          brand ink drops to 3.98:1 on mid-tone backgrounds. */}
      <header
        className="w-full px-6 pt-12 pb-16 text-center"
        style={{ backgroundColor: template.hexBackgroundColor, color: ink }}
      >
        {template.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.logoUrl}
            alt={clinic.name}
            className="mx-auto mb-4 h-12 w-auto object-contain"
          />
        ) : null}
        <p className="text-[10px] tracking-[0.25em] uppercase opacity-70">{clinic.name}</p>
        <h1 className="mt-2 font-serif text-3xl">{template.programName}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm opacity-80">{template.benefitsText}</p>
      </header>

      <div className="w-full max-w-md px-4 pb-16">
        <div className="-mt-10 rounded-lg border border-border bg-card p-6 shadow-sm">
          <SignupForm clinic={clinic} />
        </div>
      </div>
    </main>
  );
}
