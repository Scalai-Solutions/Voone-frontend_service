/**
 * The Inspírate chapter's campaign ideas: who to send to and a message ready to paste. Segments
 * only use filters the Audiencias form really has (one tier per segment, "Con bono activo",
 * "Sin visitas desde", sex, age), so a clinic can build every one of them today. Tier names are
 * Voone's defaults; clinics may have renamed theirs.
 */

import type { CampaignId } from "./tour-types.ts";

export interface CampaignAudience {
  label: string;
  /** One entry per segment to create; filters inside a segment are joined with " · ". */
  segments: readonly string[];
  /** The text to paste into "Mandar nueva comunicación" (180 characters at most). */
  message: string;
}

export interface Campaign {
  id: CampaignId;
  audiences: readonly CampaignAudience[];
}

/** The longest text a manual message can carry (communications-page-client.tsx). */
export const MANUAL_MESSAGE_MAX = 180;

export const CAMPAIGNS: readonly Campaign[] = [
  {
    id: "navidad",
    audiences: [
      {
        label: "Clientes fieles",
        segments: ["Nivel Plata", "Nivel Oro"],
        message:
          "¡Gracias por acompañarnos un año más! Tu confianza merece una Navidad especial. Hemos preparado una sorpresa exclusiva para ti.",
      },
      {
        label: "Clientes inactivos",
        segments: ["Sin visitas desde 90 días"],
        message:
          "¡Feliz Navidad! Hace tiempo que no nos vemos y nos encantaría volver a cuidar de ti. Descubre lo que hemos preparado para estas fiestas.",
      },
    ],
  },
  {
    id: "mujer",
    audiences: [
      {
        label: "Mujeres",
        segments: ["Sexo: Mujer"],
        message:
          "Hoy celebramos tu fuerza, tu historia y todo lo que te hace única. Feliz Día de la Mujer. Recuerda dedicarte también tiempo a ti misma.",
      },
      {
        label: "Hombres",
        segments: ["Sexo: Hombre"],
        message:
          "Este Día de la Mujer, reconoce a esas mujeres que tanto significan para ti. Sorprende a una mujer especial con una experiencia de bienestar.",
      },
    ],
  },
  {
    id: "ultima-hora",
    audiences: [
      {
        label: "Socios VIP",
        segments: ["Nivel Oro", "Nivel Platino", "Nivel Diamante"],
        message:
          "¡Una oportunidad exclusiva para nuestros socios VIP! Mañana tenemos un hueco disponible con una ventaja especial para ti. ¿Te apetece aprovecharlo?",
      },
    ],
  },
  {
    id: "novedades",
    audiences: [
      {
        label: "Nuevo tratamiento",
        segments: ["Sexo: Mujer · Edad desde 50"],
        message:
          "Tenemos una novedad que queremos enseñarte. Descubre nuestro nuevo tratamiento y reserva una valoración personalizada para saber si es adecuado para ti.",
      },
      {
        label: "Evento con invitada especial",
        segments: ["Sexo: Mujer · Edad 18–29"],
        message:
          "¡Tenemos un plan especial para ti! Te invitamos a descubrir nuestro próximo evento de belleza con una invitada muy especial. ¿Te lo vas a perder?",
      },
    ],
  },
  {
    id: "black-friday",
    audiences: [
      {
        label: "Clientes inactivos",
        segments: ["Sin visitas desde 120 días"],
        message:
          "Este Black Friday tienes una razón más para volver. Descubre la promoción especial que hemos preparado para reencontrarnos.",
      },
      {
        label: "Clientes con bono",
        segments: ["Con bono activo"],
        message:
          "¡Adelántate al Black Friday! Por formar parte de nuestro club, descubre nuestras condiciones especiales en productos y experiencias complementarias.",
      },
    ],
  },
];

export function findCampaign(id: CampaignId): Campaign {
  const campaign = CAMPAIGNS.find((item) => item.id === id);
  if (!campaign) throw new Error(`Unknown campaign: ${id}`);

  return campaign;
}
