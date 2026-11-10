import type { CategoryCode } from "@/lib/onboarding-api";

/**
 * The engine's categories, in the words a centre uses.
 *
 * "Centro", never "clínica": the guide is explicit about it for anything a centre reads.
 */
export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  FAC: "Facial de cabina",
  APF: "Aparatología facial",
  MAS: "Masaje",
  COR: "Tratamiento corporal",
  LAS: "Depilación láser",
  CER: "Depilación con cera",
  PEL: "Peluquería",
  UNA: "Manos y pies",
  CEJ: "Cejas y pestañas",
  COS: "Cosmética de venta",
  PRE: "Presoterapia y extras de coste casi nulo",
  DIA: "Diagnóstico y valoración",
  MFA: "Medicina: farmacológico",
  MNF: "Medicina: acto médico sin medicamento",
};

/**
 * What a centre may pick from. Hair, nails and brows exist in the engine from an earlier scope
 * and are kept there so old rows still classify, but they are not offered: the guide says
 * current centres are medical-aesthetic only.
 */
export const SELECTABLE_CATEGORIES: CategoryCode[] = [
  "FAC",
  "APF",
  "MAS",
  "COR",
  "LAS",
  "CER",
  "COS",
  "PRE",
  "DIA",
  "MFA",
  "MNF",
];

/** Categories that never earn progress and are never given away. A legal constraint in Spain. */
export const EARNS_NOTHING: ReadonlySet<CategoryCode> = new Set<CategoryCode>(["MFA", "MNF"]);

/** How the engine arrived at a category, as a short phrase for the row. */
export const CLASSIFIED_BY_LABEL: Record<string, string> = {
  "palabra clave": "detectada por el nombre",
  producto: "producto de venta",
  centro: "elegida por el centro",
  "sin clasificar": "sin clasificar",
};
