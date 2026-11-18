import type { PublicClubLadderGroup, PublicClubTier } from "@/lib/api-client";

/**
 * How the club page dresses the five tiers. The metals are Voone's, the same for every clinic, so a
 * tier looks the same on every club page; a clinic brings its own name, logo and photo.
 */
export interface TierStyle {
  /** The card's metallic gradient. */
  fin: string;
  /** The card's text colour. */
  fg: string;
  /** True when the text is light, so a logo on the card is drawn white rather than black. */
  light: boolean;
}

const BRONCE: TierStyle = {
  fin: "linear-gradient(135deg,#dcae88,#a86b4b 48%,#74422d)",
  fg: "#fff8f1",
  light: true,
};

const TIER_STYLES: Record<string, TierStyle> = {
  bronce: BRONCE,
  plata: { fin: "linear-gradient(135deg,#f6f6f4,#cfd1d2 50%,#a5a9ac)", fg: "#26272a", light: false },
  oro: { fin: "linear-gradient(135deg,#f1ddb0,#cfad6c 50%,#a07c45)", fg: "#2b2116", light: false },
  platino: { fin: "linear-gradient(135deg,#dde2e5,#9ea7ae 50%,#68727a)", fg: "#ffffff", light: true },
  diamante: { fin: "linear-gradient(135deg,#46484d,#232427 55%,#121315)", fg: "#efe6d6", light: true },
};

/** A tier this page does not know still renders, as bronze. */
export const styleOfTier = (key: string): TierStyle => TIER_STYLES[key] ?? BRONCE;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** "II / V" for the second of five tiers. */
export const tierPosition = (index: number, total: number): string =>
  `${ROMAN[index] ?? String(index + 1)} / ${ROMAN[total - 1] ?? String(total)}`;

export const badgeText = (badge: "new" | "up" | undefined): string =>
  badge === "new" ? "Nuevo" : badge === "up" ? "Mejora" : "";

export const referralHeading = (count: number): string =>
  count === 1 ? "Con 1 recomendación" : `Con ${count} recomendaciones`;

/** The tier after `key`, or undefined for the last one. */
export const nextTierOf = (tiers: PublicClubTier[], key: string): PublicClubTier | undefined => {
  const index = tiers.findIndex((tier) => tier.key === key);

  return index >= 0 ? tiers[index + 1] : undefined;
};

export interface NumberedStep {
  number: string;
  title: string;
  detail: string;
  label: string;
  mark: string | null;
  /** "2 de 5": its place among the steps of its tier. */
  position: string;
}

export interface NumberedGroup {
  tierKey: string;
  tierLabel: string;
  steps: NumberedStep[];
}

/** Numbers the steps 01, 02, ... across every tier, the way the prize rail counts them. */
export const numberLadder = (ladder: PublicClubLadderGroup[]): NumberedGroup[] => {
  let counter = 0;

  return ladder.map((group) => ({
    tierKey: group.tierKey,
    tierLabel: group.tierLabel,
    steps: group.steps.map((step, index) => ({
      ...step,
      number: String(++counter).padStart(2, "0"),
      position: `${index + 1} de ${group.steps.length}`,
    })),
  }));
};

/**
 * What the page calls the programme. "Club" is generic and the centre's own word is the name:
 * a programme called "Privé" is the "Club Privé", one called "Manzano" the "Club Manzano". A name
 * that already starts with the word (the centre typed "Club Privé") is left as it is.
 */
export const clubName = (programName: string): string => {
  const name = programName.trim();

  return /^club\b/i.test(name) ? name : `Club ${name}`;
};

/** What the referred client starts with, as a sentence. */
export const welcomeText = (programName: string, welcome: number): string =>
  welcome > 0
    ? `Entra a ${programName} con ${welcome} € de progreso ya conseguidos.`
    : `Entra a ${programName} desde el primer día.`;

/** The reward that repeats after the last tier. */
export const recurringText = (recurring: { every: number; name: string }): string =>
  `Después del último nivel, ${recurring.name} por cada ${recurring.every} € que pagues.`;
