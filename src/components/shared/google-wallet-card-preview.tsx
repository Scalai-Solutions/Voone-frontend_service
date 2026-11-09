"use client";

import * as React from "react";

import { QrCode } from "@/components/shared/qr-code";
import { relativeLuminance } from "@/components/shared/wallet-card-preview";
import { cn } from "@/lib/utils";

/**
 * Public Voone mark, drawn only when the clinic has not entered a logo of its own. Never saved.
 * Google crops the logo to a circle, so this is the square mark: the wide wordmark
 * (/voone-logo.png, about 5:1) shrinks to an unreadable sliver inside the 36px circle.
 */
const FALLBACK_LOGO = "/voone-mark.png";

type Props = {
  clinicName?: string;
  programName?: string;
  /** Card background, a hex colour. */
  color: string;
  logoUrl?: string;
  heroImageUrl?: string;
  /** The card's own button (the template's app link): shown only when the card has one. */
  buttonText?: string;
  /** Further buttons the clinic added, in order. */
  extraButtons?: Array<{ label: string }>;
  /** A website the clinic set itself: it adds "Web" to the links in Detalles. */
  hasWebsite?: boolean;
  levelLabel?: string;
  pointsLabel?: string;
  /**
   * A clinic on a programme: the card shows the member's next reward beside the tier and the
   * count of rewards waiting. Without one, the cell says "Ver beneficios" and there is no count.
   */
  programme?: boolean;
  className?: string;
};

/**
 * The loyalty card as Google Wallet shows it, opened full screen, laid out as the backend builds
 * the class (classService.buildClassTemplateInfo): the clinic's logo and name, the programme, the
 * member's name and points, the tier beside the next reward, the rewards waiting, the QR with the
 * member number under it (its only place on the card), the hero image, the card's own button, then
 * Google's "Detalles" with the further links. Example data, like the Apple preview beside it.
 */
export function GoogleWalletCardPreview({
  clinicName,
  programName,
  color,
  logoUrl,
  heroImageUrl,
  buttonText,
  extraButtons = [],
  hasWebsite = false,
  levelLabel,
  pointsLabel,
  programme = false,
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
  // Google has one button on the card; further links are listed on its details screen, "Web" first
  // as the backend orders them.
  const extraLinks = [
    ...(hasWebsite ? ["Web"] : []),
    ...extraButtons.map((button) => button.label.trim()).filter(Boolean),
  ];
  const cardButton = buttonText?.trim();
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
              <p className={label}>{pointsLabel?.trim() || "Puntos"}</p>
              <p className={value}>250</p>
            </div>
          </div>
          <div className="mx-3 mt-3 h-px bg-current opacity-20" />
          <div className="grid grid-cols-[1fr_auto] gap-3 px-4 pt-3">
            <div className="min-w-0">
              <p className={label}>{levelLabel?.trim() || "Nivel"}</p>
              <p className={cn(value, "truncate")}>Bronce</p>
            </div>
            <div className="min-w-0 text-right">
              {programme ? (
                <>
                  <p className={label}>Próxima recompensa</p>
                  <p className={cn(value, "truncate")}>Kit de minitallas</p>
                  <p className="text-[11px] opacity-75">Te faltan 300 puntos</p>
                </>
              ) : (
                <>
                  <p className={label}>Beneficio</p>
                  <p className={cn(value, "truncate")}>Ver beneficios</p>
                </>
              )}
            </div>
          </div>
          {programme ? (
            <div className="px-4 pt-3">
              <p className={label}>Regalos</p>
              <p className={value}>0 premios</p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col items-center">
            <QrCode
              value="VOONE-EJEMPLO-K7M2Q"
              size={112}
              className="rounded-2xl p-2.5"
              title="Vista previa del código QR"
            />
            <p className="mt-1.5 text-xs font-semibold tracking-wide">K7M2Q</p>
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

        {cardButton ? (
          <span className="mt-3 flex h-10 items-center justify-center truncate rounded-full bg-[#0b57d0] px-4 text-sm font-semibold text-white">
            {cardButton}
          </span>
        ) : null}
        <span className="mt-3 flex h-10 items-center justify-center truncate rounded-full border border-[#c4c7c5] px-4 text-sm font-semibold text-[#0b57d0]">
          Detalles
        </span>
        {extraLinks.length > 0 ? (
          <div className="mt-3 rounded-2xl bg-[#f3f4f6] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#5f6368]">
              Se muestran al pulsar Detalles
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
