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
  pointsLabel: "Saldo Beauty",
  tierLabel: "Miembro Gold",
  benefits: "",
  infoText: "",
};

export const templateStarters: Record<TemplateStarterId, TemplateStarter> = {
  "signature-glow": {
    id: "signature-glow",
    title: "Plantilla 1",
    eyebrow: "Signature Glow Club",
    description: "Un pase cálido de fidelización para puntos por tratamientos, crédito por visitas y recompensas habituales.",
    values: {
      name: "Signature Glow Club",
      clinicBranding: "Club Clínica Aurea",
      backgroundColor: "#ead0bd",
      pointsLabel: "Puntos Glow",
      tierLabel: "Miembro Gold",
      benefits: "Reserva prioritaria, crédito de cumpleaños y recompensas de temporada.",
      infoText: "Muestra este pase en recepción antes de pagar para acumular puntos.",
    },
    appleCard: {
      clinic: "AUREA",
      clinicSub: "APPLE WALLET",
      member: "Veronica Navarro",
      tierLabel: "MIEMBRO GOLD",
      tier: "Gold",
      points: "1.250",
      balance: "EUR240",
      reward: "Hydrafacial a 250 pts - faltan 2 visitas",
      progress: 83,
      since: "2026",
    },
    googleCard: {
      clinic: "AUREA",
      clinicSub: "GOOGLE WALLET",
      member: "Lucia Gomez",
      tierLabel: "MIEMBRO GOLD",
      tier: "Gold",
      points: "1.540",
      balance: "EUR180",
      reward: "Upgrade de peeling a 1.800 pts",
      progress: 72,
      since: "2026",
    },
  },
  "diamond-skin": {
    id: "diamond-skin",
    title: "Plantilla 2",
    eyebrow: "Diamond Skin Plan",
    description: "Un pase premium para saldos de paquetes, ventajas de nivel superior y programas avanzados de piel.",
    values: {
      name: "Diamond Skin Plan",
      clinicBranding: "Aurea Skin Studio",
      backgroundColor: "#2a2e35",
      pointsLabel: "Créditos Skin",
      tierLabel: "Miembro Diamond",
      benefits: "Agenda VIP, crédito para paquetes láser y vistas privadas de tratamientos.",
      infoText: "Usa este pase para visitas, saldos de paquetes y beneficios de nivel.",
    },
    appleCard: {
      clinic: "AUREA",
      clinicSub: "APPLE WALLET",
      member: "Alvaro Ferrer",
      tierLabel: "MIEMBRO DIAMOND",
      tier: "Diamond",
      points: "4.980",
      balance: "EUR620",
      reward: "Sesión láser a 5.000 pts - faltan 20 pts",
      progress: 96,
      since: "2025",
    },
    googleCard: {
      clinic: "AUREA",
      clinicSub: "GOOGLE WALLET",
      member: "Mateo Ruiz",
      tierLabel: "MIEMBRO DIAMOND",
      tier: "Diamond",
      points: "3.760",
      balance: "EUR510",
      reward: "Revisión de piel desbloqueada este mes",
      progress: 88,
      since: "2025",
    },
  },
  scratch: {
    id: "scratch",
    title: "Personalizar desde cero",
    eyebrow: "Tarjeta en blanco",
    description: "Empieza con un pase Wallet limpio y diseña manualmente la fidelización de la clínica.",
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