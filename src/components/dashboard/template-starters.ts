import type { SaveTemplateInput } from "@/lib/api-client";
import type { WalletCardData } from "@/components/ui/wallet-card";

export type TemplateStarterId = "signature-glow" | "diamond-skin" | "scratch";

export interface TemplateStarter {
  id: TemplateStarterId;
  title: string;
  eyebrow: string;
  description: string;
  values: SaveTemplateInput;
  appleCard?: Partial<WalletCardData>;
  googleCard?: Partial<WalletCardData>;
}

export const scratchTemplateValues: SaveTemplateInput = {
  name: "",
  clinicBranding: "",
  backgroundColor: "#ead0bd",
  pointsLabel: "Beauty Balance",
  tierLabel: "Gold Member",
  benefits: "",
  infoText: "",
};

export const templateStarters: Record<TemplateStarterId, TemplateStarter> = {
  "signature-glow": {
    id: "signature-glow",
    title: "Template 1",
    eyebrow: "Signature Glow Club",
    description: "A warm clinic loyalty pass for treatment points, visit credit, and everyday member rewards.",
    values: {
      name: "Signature Glow Club",
      clinicBranding: "Aurea Clinic Club",
      backgroundColor: "#ead0bd",
      pointsLabel: "Glow Points",
      tierLabel: "Gold Member",
      benefits: "Priority booking, birthday credit, and seasonal treatment rewards.",
      infoText: "Show this pass at reception before checkout to collect points.",
    },
    appleCard: {
      clinic: "AUREA",
      clinicSub: "APPLE WALLET",
      member: "Veronica Navarro",
      tierLabel: "GOLD MEMBER",
      tier: "Gold",
      points: "1.250",
      balance: "EUR240",
      reward: "Hydrafacial at 250 pts - 2 visits left",
      progress: 83,
      since: "2026",
    },
    googleCard: {
      clinic: "AUREA",
      clinicSub: "GOOGLE WALLET",
      member: "Lucia Gomez",
      tierLabel: "GOLD MEMBER",
      tier: "Gold",
      points: "1.540",
      balance: "EUR180",
      reward: "Peel upgrade at 1.800 pts",
      progress: 72,
      since: "2026",
    },
  },
  "diamond-skin": {
    id: "diamond-skin",
    title: "Template 2",
    eyebrow: "Diamond Skin Plan",
    description: "A premium clinic pass for package balances, higher-tier perks, and advanced skin programs.",
    values: {
      name: "Diamond Skin Plan",
      clinicBranding: "Aurea Skin Studio",
      backgroundColor: "#2a2e35",
      pointsLabel: "Skin Credits",
      tierLabel: "Diamond Member",
      benefits: "VIP scheduling, laser package credit, and private treatment previews.",
      infoText: "Use this pass for visits, package balances, and tier benefits.",
    },
    appleCard: {
      clinic: "AUREA",
      clinicSub: "APPLE WALLET",
      member: "Alvaro Ferrer",
      tierLabel: "DIAMOND MEMBER",
      tier: "Diamond",
      points: "4.980",
      balance: "EUR620",
      reward: "Laser session at 5.000 pts - 20 pts left",
      progress: 96,
      since: "2025",
    },
    googleCard: {
      clinic: "AUREA",
      clinicSub: "GOOGLE WALLET",
      member: "Mateo Ruiz",
      tierLabel: "DIAMOND MEMBER",
      tier: "Diamond",
      points: "3.760",
      balance: "EUR510",
      reward: "Skin review unlocked this month",
      progress: 88,
      since: "2025",
    },
  },
  scratch: {
    id: "scratch",
    title: "Customize from scratch",
    eyebrow: "Blank card",
    description: "Start with a clean wallet pass and build the clinic loyalty design manually.",
    values: scratchTemplateValues,
  },
};

export function normalizeTemplateStarterId(value: string | string[] | undefined): TemplateStarterId | undefined {
  const starter = Array.isArray(value) ? value[0] : value;
  return starter === "signature-glow" || starter === "diamond-skin" || starter === "scratch" ? starter : undefined;
}

export function getTemplateStarterValues(starter: TemplateStarterId | undefined) {
  return starter ? templateStarters[starter].values : undefined;
}