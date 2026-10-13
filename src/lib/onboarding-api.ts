import { ApiError } from "@/lib/api-client";

/**
 * The onboarding programme API, as the browser calls it.
 *
 * Every call goes to this app's own `/api/admin/...` route handler, which holds the staff key
 * and checks for a Voone admin session; the browser never talks to the backend directly. The
 * types mirror the backend's payloads exactly. They are deliberately written out here rather
 * than inferred, so a change to the backend shape shows up as a type error in the screens that
 * read it instead of as a blank cell.
 *
 * Costs never appear in the presented programme: the backend builds it from a projection that
 * cannot read one. The `internal` block is Voone-only and the screens hide it behind a toggle.
 */

export type CategoryCode =
  | "FAC"
  | "APF"
  | "MAS"
  | "COR"
  | "LAS"
  | "CER"
  | "PEL"
  | "UNA"
  | "CEJ"
  | "COS"
  | "PRE"
  | "DIA"
  | "MFA"
  | "MNF";

export type TierKey = "bronce" | "plata" | "oro" | "platino" | "diamante";

/* ------------------------------------------------------------------------- catalogue */

export interface CatalogRow {
  externalId: string;
  name: string;
  priceEuro: number;
  durationMin: number | null;
  isProduct: boolean;
  /** The category the centre chose, or null to let the engine decide. */
  categoryId: string | null;
  costPctOverride: number | null;
  estimated: boolean;
  position: number;
  /** The category the engine ended up with, and how. */
  category: CategoryCode | null;
  classifiedBy: string | null;
  needsReview: boolean;
}

/** What is sent when saving. Prices are euros as a number, never the text typed. */
export interface CatalogInputRow {
  externalId: string;
  name: string;
  priceEuro: number;
  isProduct?: boolean;
  categoryId?: CategoryCode | null;
  estimated?: boolean;
}

export interface SkippedCsvRow {
  line: number;
  reason: string;
  raw: string;
}

export interface CsvImportResult {
  imported: number;
  skipped: SkippedCsvRow[];
  notes: string[];
  items: CatalogRow[];
}

/* -------------------------------------------------------------------------- answers */

export type Objective = "equilibrado" | "mas_visitas" | "mas_gasto" | "mas_clientes_nuevos";
export type Investment = "conservador" | "equilibrado" | "generoso";
export type Occupancy = "o1" | "o2" | "o3" | "o4";
export type MembersBucket = "m1" | "m2" | "m3" | "m4";

export interface OnboardingAnswers {
  /** Null or absent means "use the estimate from the catalogue". */
  ticket?: string | null;
  freq?: string | null;
  objective: Objective;
  investment: Investment;
  occupancy: Occupancy;
  members?: MembersBucket;
}

export interface OnboardingEstimates {
  segment: string;
  ticketEstimate: number;
  visitsEstimate: number;
  annualSpend: number;
  preselectedTicketBucket: string;
  preselectedFreqBucket: string;
  ticketBuckets: Array<{ id: string; label: string; value: number }>;
  freqBuckets: Array<{ id: string; label: string }>;
  /** Rows the engine could not file, which the centre must categorise. */
  unclassified: Array<{ externalId: string; name: string }>;
}

/* ------------------------------------------------------------------------ programme */

export interface PresentedItem {
  name: string;
  value: number;
}

export interface PresentedMilestone {
  n: number;
  /** The tier band, 1 to 4. */
  band: number;
  type: "premio" | "ventaja" | "nivel";
  /** Progress euros. */
  threshold: number;
  tier?: { key: TierKey; label: string };
  reward?: {
    name: string;
    value: number;
    items: PresentedItem[];
    alternatives: Array<{ name: string; value: number; items: PresentedItem[] }>;
  };
  perk?: { kind: string; name: string; description: string };
}

export interface PresentedTier {
  key: TierKey;
  label: string;
  threshold: number;
  minTenureMonths: number;
  benefits: string[];
}

export interface PresentedProgram {
  estimates: { segment: string; ticket: number; visitsPerYear: number; annualSpend: number };
  tiers: PresentedTier[];
  ladder: PresentedMilestone[];
  recurring: { every: number; name: string; value: number };
  referrals: Array<{ n: number; name: string; value: number }>;
  welcomeProgress: number;
  familyAndFriends: { title: string; description: string };
  adaptations: string[];
  review: string[];
}

export interface InternalBlock {
  /** Share of a client's spend the programme consumes. Voone only. */
  costPct: number;
  guarantees: Array<{ text: string; held: boolean }>;
}

export type ProgramStatus = "BORRADOR" | "ACTIVO" | "SUSTITUIDO";

export interface ProgramEnvelope {
  id: string;
  version: number;
  status: ProgramStatus;
  engineVersion: string;
  configVersion: string;
  publishedAt: string | null;
  answers: OnboardingAnswers;
  program: PresentedProgram;
  internal: InternalBlock;
}

export interface ProgramPreview {
  program: PresentedProgram;
  internal: InternalBlock;
}

export interface ProgramListItem {
  id: string;
  version: number;
  status: ProgramStatus;
  engineVersion: string;
  configVersion: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface RecalibrationAdvice {
  offer: boolean;
  ticketDrift: number;
  visitsDrift: number;
  reason?: string;
  measured: { ticket: number; visitsPerYear: number } | null;
  used: { ticket: number; visitsPerYear: number } | null;
  daysOfData: number;
}

/* ---------------------------------------------------------------------------- calls */

async function request<T>(clinicId: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}/onboarding${path}`,
    {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    // The backend's messages are the Spanish copy to show, so they travel as `detail`.
    throw new ApiError(
      `Onboarding request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const getCatalog = (clinicId: string) =>
  request<{ items: CatalogRow[] }>(clinicId, "/catalog").then((r) => r.items);

export const replaceCatalog = (clinicId: string, items: CatalogInputRow[]) =>
  request<{ items: CatalogRow[] }>(clinicId, "/catalog", {
    method: "PUT",
    ...json({ items }),
  }).then((r) => r.items);

export const importCatalogCsv = (clinicId: string, csv: string) =>
  request<CsvImportResult>(clinicId, "/catalog/import", { method: "POST", ...json({ csv }) });

export const getEstimates = (clinicId: string) =>
  request<OnboardingEstimates>(clinicId, "/estimates");

export const previewProgram = (clinicId: string, answers: OnboardingAnswers) =>
  request<ProgramPreview>(clinicId, "/preview", { method: "POST", ...json(answers) });

export const listPrograms = (clinicId: string) =>
  request<{ programs: ProgramListItem[] }>(clinicId, "/programs").then((r) => r.programs);

export const getProgram = (clinicId: string, programId: string) =>
  request<ProgramEnvelope>(clinicId, `/programs/${encodeURIComponent(programId)}`);

export const createDraft = (clinicId: string, answers: OnboardingAnswers) =>
  request<ProgramEnvelope>(clinicId, "/programs", { method: "POST", ...json(answers) });

export const publishProgram = (clinicId: string, programId: string) =>
  request<ProgramEnvelope>(clinicId, `/programs/${encodeURIComponent(programId)}/publish`, {
    method: "POST",
  });

export const swapMilestone = (
  clinicId: string,
  programId: string,
  milestone: number,
  alternative: number,
) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/milestones/${milestone}`,
    { method: "PATCH", ...json({ alternative }) },
  );

export const getRecalibration = (clinicId: string) =>
  request<RecalibrationAdvice>(clinicId, "/recalibration");
