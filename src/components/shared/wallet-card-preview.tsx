"use client";

import * as React from "react";

import { QrCode } from "@/components/shared/qr-code";
import { cn } from "@/lib/utils";

/** Public Voone logo, drawn only when the clinic has not entered a logo of its own. Never saved. */
const FALLBACK_LOGO = "/voone-logo.png";

type Props = {
  /** Used for the accessible name of the logo and the card. */
  clinicName?: string;
  programName?: string;
  /** Card background, a hex colour. */
  color: string;
  logoUrl?: string;
  heroImageUrl?: string;
  /** Everything below is example data, drawn as such. */
  memberName?: string;
  memberNumber?: string;
  /** The member's level, for example "Bronce". */
  level?: string;
  /** The label the card puts on the level, for example "Nivel". */
  levelLabel?: string;
  pointsLabel?: string;
  points?: number;
  /** Points the next reward needs. */
  nextRewardPoints?: number;
  className?: string;
};

export function relativeLuminance(hex: string) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "30221f";
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const number = (value: number) => value.toLocaleString("es-ES");

/**
 * The loyalty card as the client sees it in the wallet, for every place that previews it:
 * logo on the left and level on the right, the hero image with the points over it, one row
 * with name, number, distance to the next reward and progress, then the QR.
 *
 * It is one component so the onboarding wizard and the clinic's card editor cannot drift
 * apart. The member data is an example and is labelled "Ejemplo".
 */
export function WalletCardPreview({
  clinicName,
  programName,
  color,
  logoUrl,
  heroImageUrl,
  memberName = "Nombre Apellido",
  memberNumber = "000123",
  level = "Bronce",
  levelLabel,
  pointsLabel,
  points = 0,
  nextRewardPoints = 100,
  className,
}: Props) {
  const [brokenLogo, setBrokenLogo] = React.useState<string | null>(null);
  const [brokenHero, setBrokenHero] = React.useState<string | null>(null);
  const ownLogo = logoUrl?.trim() ?? "";
  // Display only: with no logo, or one that does not load, the preview draws the Voone logo.
  const logo = ownLogo && brokenLogo !== ownLogo ? ownLogo : FALLBACK_LOGO;
  const hero = heroImageUrl?.trim() && brokenHero !== heroImageUrl.trim() ? heroImageUrl.trim() : null;
  const ink = relativeLuminance(color) > 0.45 ? "#2b211c" : "#ffffff";
  const remaining = Math.max(nextRewardPoints - points, 0);
  const progress = nextRewardPoints > 0 ? Math.min(Math.round((points / nextRewardPoints) * 100), 100) : 0;

  return (
    <figure className={cn("m-0 w-full max-w-[340px]", className)} aria-label={`Tarjeta de ${programName || clinicName || "fidelización"}`}>
      <div
        className="overflow-hidden rounded-[22px] shadow-[0_18px_44px_-28px_rgba(0,0,0,0.7)]"
        style={{ backgroundColor: color, color: ink }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="flex h-9 max-w-[150px] items-center rounded-lg bg-white/95 px-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={clinicName ? `Logo de ${clinicName}` : "Logo"}
              onError={() => setBrokenLogo(ownLogo)}
              className="max-h-6 w-auto max-w-full object-contain"
            />
          </span>
          <div className="min-w-0 text-right">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] opacity-70">{levelLabel?.trim() || "Nivel"}</p>
            <p className="truncate text-sm font-bold">{level}</p>
          </div>
        </div>

        <div
          className="relative flex h-36 items-end bg-black/15 bg-cover bg-center"
          style={hero ? { backgroundImage: `url(${JSON.stringify(hero)})` } : undefined}
        >
          {hero ? (
            // Loads the same image off-screen only to learn when the link is broken.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" onError={() => setBrokenHero(hero)} className="hidden" />
          ) : null}
          <div className="w-full bg-gradient-to-t from-black/65 via-black/25 to-transparent px-4 pb-3 pt-10 text-white">
            <p className="font-serif text-4xl font-semibold leading-none">{number(points)}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] opacity-80">{pointsLabel?.trim() || "Puntos"}</p>
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 px-4 py-3 text-[10px]">
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] opacity-70">Miembro</p>
            <p className="mt-0.5 truncate font-bold">{memberName}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] opacity-70">N.º</p>
            <p className="mt-0.5 truncate font-bold">{memberNumber}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] opacity-70">Faltan</p>
            <p className="mt-0.5 truncate font-bold">{number(remaining)} puntos</p>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] opacity-70">Progreso</p>
            <p className="mt-0.5 truncate font-bold">{progress}%</p>
          </div>
        </div>

        <div className="flex flex-col items-center px-4 pb-4 pt-1">
          <QrCode value={`VOONE-EJEMPLO-${memberNumber}`} size={96} className="rounded-xl p-2" title="Vista previa del código QR" />
          <p className="mt-2 text-[10px] font-semibold tracking-[0.12em]">{memberNumber}</p>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-[10px] text-[#927e72]">Ejemplo: los datos del miembro no son reales.</figcaption>
    </figure>
  );
}
