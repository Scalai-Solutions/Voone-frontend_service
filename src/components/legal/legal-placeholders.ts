/**
 * Every value the two consent documents still need from Voone's team or its lawyer.
 *
 * A document marks each one with `<Ph k="KEY" />`, which prints `[[KEY]]` highlighted, so a
 * draft can never be mistaken for final text. This registry is the list to send to the team;
 * the test next to it fails if a document uses a key that is not listed here, or a key listed
 * here is no longer used, so the list cannot drift from the pages.
 */
export interface PlaceholderInfo {
  /** What the document needs, as a question for whoever answers it. */
  ask: string;
  /** Who can answer. */
  owner: "Legal" | "Voone" | "Tech";
}

export const PLACEHOLDERS = {
  CONTRATO_SERVICIO: {
    ask: "Name and version of the commercial contract or terms of service this agreement is annexed to (the DPA's duration follows it).",
    owner: "Legal",
  },
  DPO: {
    ask: "Has Voone appointed a data protection officer? If so, name and contact. If not, the sentence saying it is not required.",
    owner: "Legal",
  },
  BASE_DATOS_SALUD: {
    ask: "Legal basis for the visit descriptions that can reveal health (for example 'Visita de pago: Hiperhidrosis'): explicit consent under art. 9(2)(a), or the healthcare basis under art. 9(2)(h)? Decides whether sign-up needs a third, separate checkbox.",
    owner: "Legal",
  },
  PLAZO_CONSERVACION_CLIENTE: {
    ask: "How long a client's data is kept after their last visit before it is erased (for example 24 months).",
    owner: "Legal",
  },
  PLAZO_AVISO_BRECHA: {
    ask: "Hours within which Voone tells a centre about a data breach (the centre has 72 h to notify the AEPD; 48 h is common).",
    owner: "Legal",
  },
  PLAZO_DEVOLUCION_SUPRESION: {
    ask: "Days after the contract ends within which Voone returns or deletes a centre's data (for example 30).",
    owner: "Legal",
  },
  PREAVISO_SUBENCARGADOS: {
    ask: "Days of notice Voone gives a centre before adding or replacing a sub-processor, and how (email, notice in the dashboard).",
    owner: "Legal",
  },
  PREAVISO_AUDITORIA: {
    ask: "Notice a centre must give to audit Voone, and who bears the cost.",
    owner: "Legal",
  },
  ANEXO_MEDIDAS_SEGURIDAD: {
    ask: "The security measures Voone commits to (art. 32 RGPD): access control, encryption in transit and at rest, backups, logging, incident process. Engineering supplies the facts, legal words them.",
    owner: "Tech",
  },
  HOSTING_UBICACION: {
    ask: "Hosting provider and region where the database and application run (Railway: which region?).",
    owner: "Tech",
  },
  TRANSFERENCIAS_INTERNACIONALES: {
    ask: "Safeguard for transfers outside the EEA to providers such as the email sender, Apple and Google (EU-US Data Privacy Framework certification or standard contractual clauses).",
    owner: "Legal",
  },
  FUERO: {
    ask: "Governing law and courts for disputes over this agreement (for example the courts of Madrid).",
    owner: "Legal",
  },
  CONTACTO_PRIVACIDAD: {
    ask: "Address for privacy requests. The landing uses business@voone.ai; is there a dedicated one (for example privacidad@voone.ai)?",
    owner: "Voone",
  },
} as const satisfies Record<string, PlaceholderInfo>;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

/** Voone's identity as published on the website's legal notice (from the redesign pack). */
export const VOONE_ENTITY = {
  name: "Voone Digital SL",
  taxId: "B05593223",
  address: "Calle Arrianza nº 8, Planta 6, Puerta D, 28008 Madrid",
} as const;
