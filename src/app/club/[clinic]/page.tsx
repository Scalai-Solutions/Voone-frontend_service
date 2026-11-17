import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClubPage } from "@/components/club/club-page";
import { ApiError, getPublicClub } from "@/lib/api-client";

import { clubDisplay, clubSans } from "../club-fonts";
import "../club.css";

/**
 * A clinic's public club page: the benefits of each tier, the prizes on the way and what
 * recommending the clinic earns, read from its live programme. The QR on the clinic's flyers and the
 * link on the sign-up confirmation both point here.
 *
 * Unauthenticated by design and outside the (dashboard)/(admin) groups, like /alta/[clinic].
 */

const loadClub = async (slug: string) => {
  try {
    return await getPublicClub(slug);
  } catch (error) {
    // A 404 covers an unknown or inactive clinic and one with no live programme yet: "this link
    // does not work", and nothing that tells them apart. Anything else is our fault and goes to
    // the error boundary rather than telling someone with a flyer in hand that it expired.
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  }
};

export async function generateMetadata({ params }: PageProps<"/club/[clinic]">): Promise<Metadata> {
  const { clinic: slug } = await params;

  try {
    const { clinic } = await getPublicClub(slug);

    return {
      title: `${clinic.template.programName} · ${clinic.name}`,
      description: `Ventajas por nivel, escalera de premios y programa de recomendación de ${clinic.name}.`,
      // Reached from a flyer or a card, not from search; indexing one page per clinic would list
      // the clients' clinics.
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Voone", robots: { index: false, follow: false } };
  }
}

export default async function ClubRoute({ params }: PageProps<"/club/[clinic]">) {
  const { clinic: slug } = await params;
  const { clinic, club } = await loadClub(slug);

  return (
    // The page is Spanish whatever the app shell declares, so a phone browser does not offer to
    // translate it.
    <div lang="es" className={`${clubDisplay.variable} ${clubSans.variable}`}>
      <ClubPage clinic={clinic} club={club} />
    </div>
  );
}
