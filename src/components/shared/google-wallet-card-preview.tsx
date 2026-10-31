"use client";

import * as React from "react";

import { QrCode } from "@/components/shared/qr-code";
import { relativeLuminance } from "@/components/shared/wallet-card-preview";
import { cn } from "@/lib/utils";

/** Public Voone logo, drawn only when the clinic has not entered a logo of its own. Never saved. */
const FALLBACK_LOGO = "/voone-logo.png";

type Props = {
  clinicName?: string;
  programName?: string;
  /** Card background, a hex colour. */
  color: string;
  logoUrl?: string;
  heroImageUrl?: string;
  /** The label of the main button, shown under the card beside "Detalles". */
  buttonText?: string;
  /** Further buttons the clinic added, in order. */
  extraButtons?: Array<{ label: string }>;
  levelLabel?: string;
  className?: string;
};

/**
 * The loyalty card as Google Wallet shows it, opened full screen: the clinic's logo and name over
 * a divider, the programme, the member's name and points, number, level and benefit, the QR, the
 * hero image, then the "Detalles" button. Google allows one button on the card, so extra links are listed as
 * what opens inside Detalles. Example data, like the Apple
 * preview beside it.
 */
export function GoogleWalletCardPreview({
  clinicName,
  programName,
  color,
  logoUrl,
  heroImageUrl,
  buttonText,
  extraButtons = [],
  levelLabel,
  className,
}: Props) {
  const [brokenLogo, setBrokenLogo] = React.useState<string | null>(null);
  const [brokenHero, setBrokenHero] = React.useState<string | null>(null);
  const ownLogo = logoUrl?.trim() ?? "";
  const logo = ownLogo && brokenLogo !== ownLogo ? ownLogo : FALLBACK_LOGO;
  const hero =
    heroImageUrl?.trim() && brokenHero !== heroImageUrl.trim()
      ? heroImageUrl.trim()
      : null;
  const ink = relativeLuminance(color) > 0.45 ? "#2b211c" : "#ffffff";
  // Google has one button on the card; further links are listed on its details screen.
  const extraLinks = extraButtons
    .map((button) => button.label.trim())
    .filter(Boolean);
  const label = "text-[11px] opacity-75";
  const value = "mt-0.5 text-[13px] font-semibold";

  return (
    <figure
      className={cn("m-0 w-full max-w-[340px]", className)}
      aria-label={`Tarjeta de Google Wallet de ${programName || clinicName || "fidelización"}`}
    >
      <div className="rounded-[28px] bg-white p-3 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.5)] ring-1 ring-black/5">
        <div
          className="overflow-hidden rounded-[22px]"
          style={{ backgroundColor: color, color: ink }}
        >
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={clinicName ? `Logo de ${clinicName}` : "Logo"}
              onError={() => setBrokenLogo(ownLogo)}
              className="h-9 w-9 shrink-0 rounded-full bg-white/95 object-contain p-1"
            />
            <p className="min-w-0 truncate text-sm font-semibold">
              {clinicName?.trim() || "Tu centro"}
            </p>
          </div>
          <div className="mx-3 h-px bg-current opacity-20" />

          <div className="px-4 pt-3">
            <p className="text-xs font-semibold">Club de fidelización</p>
            <p className="mt-1 break-words text-[28px] font-normal leading-8">
              {programName?.trim() || "Club Diamante"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 px-4">
            <div className="min-w-0">
              <p className={label}>Nombre de miembro</p>
              <p className={cn(value, "truncate")}>Nombre del cliente</p>
            </div>
            <div className="text-right">
              <p className={label}>Puntos</p>
              <p className={value}>250</p>
            </div>
          </div>
          <div className="mx-3 mt-3 h-px bg-current opacity-20" />
          <div className="grid grid-cols-3 gap-2 px-4 pt-3">
            <div className="min-w-0">
              <p className={label}>N.º de miembro</p>
              <p className={cn(value, "truncate")}>SOCIO-123</p>
            </div>
            <div className="min-w-0 text-center">
              <p className={label}>{levelLabel?.trim() || "Nivel"}</p>
              <p className={cn(value, "truncate")}>Bronce</p>
            </div>
            <div className="min-w-0 text-right">
              <p className={label}>Beneficio</p>
              <p className={cn(value, "truncate")}>
                {buttonText?.trim() || "Ver beneficios"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <QrCode
              value="VOONE-EJEMPLO-SOCIO-123"
              size={112}
              className="rounded-2xl p-2.5"
              title="Vista previa del código QR"
            />
          </div>

          <div
            className="mt-4 h-32 bg-black/15 bg-cover bg-center"
            style={
              hero
                ? { backgroundImage: `url(${JSON.stringify(hero)})` }
                : undefined
            }
          >
            {hero ? (
              // Loads the same image off-screen only to learn when the link is broken.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero}
                alt=""
                onError={() => setBrokenHero(hero)}
                className="hidden"
              />
            ) : null}
          </div>
        </div>

        <span className="mt-3 flex h-10 items-center justify-center truncate rounded-full border border-[#c4c7c5] px-4 text-sm font-semibold text-[#0b57d0]">
          Detalles
        </span>
        {extraLinks.length > 0 ? (
          <div className="mt-3 rounded-2xl bg-[#f3f4f6] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#5f6368]">
              Al abrir Detalles
            </p>
            <ul className="mt-1.5 grid gap-1">
              {extraLinks.map((text, index) => (
                <li
                  key={`${text}-${index}`}
                  className="truncate text-sm font-semibold text-[#0b57d0]"
                >
                  {text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <figcaption className="mt-2 text-center text-[10px] text-[#927e72]">
        Ejemplo: los datos del miembro no son reales.
      </figcaption>
    </figure>
  );
}
