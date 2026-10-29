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

export type Objective =
  "equilibrado" | "mas_visitas" | "mas_gasto" | "mas_clientes_nuevos";
export type Investment = "conservador" | "equilibrado" | "generoso";
export type Occupancy = "o1" | "o2" | "o3" | "o4";
export type MembersBucket = "m1" | "m2" | "m3" | "m4";

export interface OnboardingAnswers {
  /** Null or absent means "use the estimate from the catalogue". */
  ticket?: string | null;
  freq?: string | null;
  /**
   * The centre's own exact figures. They win over the buckets above, and everything in the
   * programme is built from annual spend (ticket x visits), so changing either regenerates the
   * whole programme. Null or absent means the recommended value.
   */
  ticketValue?: number | null;
  visitsValue?: number | null;
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
  /** The ranges the exact figures may take; the backend refuses anything outside them. */
  limits: {
    ticket: { min: number; max: number };
    visits: { min: number; max: number };
  };
  ticketBuckets: Array<{ id: string; label: string; value: number }>;
  freqBuckets: Array<{ id: string; label: string }>;
  /** Rows the engine could not file, which the centre must categorise. */
  unclassified: Array<{ externalId: string; name: string }>;
}

/* ------------------------------------------------------------------------ programme */

/**
 * A gift, by name only. What a gift is worth or costs is deliberately not here: the founders'
 * review is that a centre should see what it gives and what its clients spend, not what each
 * gift is worth. The backend does not send a value, so no screen can show one.
 */
export interface PresentedItem {
  name: string;
}

export interface PresentedMilestone {
  n: number;
  /** The tier band, 1 to 4. */
  band: number;
  type: "premio" | "ventaja" | "nivel";
  /** Progress euros. Not shown: `realSpend` is what a centre reads. */
  threshold: number;
  /** What a client has actually paid when she reaches this step, in whole euros. */
  realSpend: number;
  /** Months for a typical repeating client to get here. */
  month: number;
  tier?: { key: TierKey; label: string };
  reward?: {
    name: string;
    items: PresentedItem[];
    alternatives: Array<{ name: string; items: PresentedItem[] }>;
  };
  perk?: { kind: string; name: string; description: string };
}

/**
 * One line of a tier, hidden ones included (flagged) so the screen can show and restore them.
 * `key` is stable: a generated line's is derived from what it is ("mult", "discount", ...), a line
 * the centre added is "custom:<index>". `text` is what clients read, `original` what the engine or
 * the centre wrote.
 */
export interface BenefitLine {
  key: string;
  text: string;
  original: string;
  kind: "generated" | "custom";
  edited: boolean;
  hidden: boolean;
}

export interface PresentedTier {
  key: TierKey;
  label: string;
  threshold: number;
  minTenureMonths: number;
  /** What clients read: the visible lines' texts, in order. */
  benefits: string[];
  /** The ones the centre wrote itself, in its own list. */
  customBenefits: string[];
  /** Every line with its key. Absent from an older backend: the screen then falls back to `benefits`. */
  benefitLines?: BenefitLine[];
}

export interface PresentedProgram {
  estimates: {
    segment: string;
    ticket: number;
    visitsPerYear: number;
    annualSpend: number;
  };
  tiers: PresentedTier[];
  ladder: PresentedMilestone[];
  /** After Diamante: one reward for every `every` euros a client pays. */
  recurring: { every: number; name: string };
  /** `minRevenue`: the least the centre has earned from the people referred by this step. */
  referrals: Array<{ n: number; name: string; minRevenue: number }>;
  welcomeProgress: number;
  familyAndFriends: { title: string; description: string; comingSoon: boolean };
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

/* ----------------------------------------------------------------------- calculator */

export interface CalcInput {
  /** Members the centre expects in the programme once onboarding is complete. */
  clients: number;
  /** Euros per visit. */
  ticket: number;
}

export interface CalcLine {
  key: string;
  label: string;
  amount: number;
}

export interface CalcYear {
  year: number;
  avgMembers: number;
  /** Members at the end of the year, by tier. */
  byTier: Record<TierKey, number>;
  generates: { total: number; lines: CalcLine[] };
  costs: { total: number; lines: CalcLine[] };
  net: number;
  cumulativeNet: number;
}

export interface CalcResult {
  input: CalcInput;
  /** What the programme suggests, so the screen can offer to reset to it. */
  defaults: CalcInput;
  years: CalcYear[];
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

async function request<T>(
  clinicId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
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
  request<CsvImportResult>(clinicId, "/catalog/import", {
    method: "POST",
    ...json({ csv }),
  });

export const getEstimates = (clinicId: string) =>
  request<OnboardingEstimates>(clinicId, "/estimates");

export const previewProgram = (clinicId: string, answers: OnboardingAnswers) =>
  request<ProgramPreview>(clinicId, "/preview", {
    method: "POST",
    ...json(answers),
  });

export const listPrograms = (clinicId: string) =>
  request<{ programs: ProgramListItem[] }>(clinicId, "/programs").then(
    (r) => r.programs,
  );

export const getProgram = (clinicId: string, programId: string) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}`,
  );

export const createDraft = (clinicId: string, answers: OnboardingAnswers) =>
  request<ProgramEnvelope>(clinicId, "/programs", {
    method: "POST",
    ...json(answers),
  });

export const publishProgram = (clinicId: string, programId: string) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/publish`,
    {
      method: "POST",
    },
  );

/** One of the engine's two alternatives, or any catalogue item by its id. */
export type SwapChoice = { alternative: number } | { itemId: string };

export const swapMilestone = (
  clinicId: string,
  programId: string,
  milestone: number,
  choice: SwapChoice,
) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/milestones/${milestone}`,
    { method: "PATCH", ...json(choice) },
  );

export const setTierBenefits = (
  clinicId: string,
  programId: string,
  tier: TierKey,
  benefits: string[],
) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/tiers/${encodeURIComponent(tier)}/benefits`,
    { method: "PUT", ...json({ benefits }) },
  );

/**
 * One change to a line the engine generated. Each entry REPLACES that line's override as a whole:
 * `text` null/absent clears the edit, `hidden` null/false/absent shows the line, and an entry with
 * neither clears the override. Display only: the real benefit never changes.
 */
export interface BenefitOverrideEntry {
  key: string;
  text?: string | null;
  hidden?: boolean | null;
}

export const setBenefitOverrides = (
  clinicId: string,
  programId: string,
  tier: TierKey,
  overrides: BenefitOverrideEntry[],
) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/tiers/${encodeURIComponent(tier)}/benefit-overrides`,
    { method: "PUT", ...json({ overrides }) },
  );

/**
 * The words of a DRAFT, by what they are attached to. Anything omitted is left as it is.
 * `index` is the 0-based position in `program.referrals`; `milestone` is the ladder number `n`
 * of a `ventaja` row (perks) or a `premio` row (rewards). A `null` label restores the engine's
 * own name. No lock field travels: the backend checks the draft's `updatedAt` itself and
 * answers 409 if it changed meanwhile, exactly as for the benefits PUT.
 */
export interface TextEdits {
  referral?: Array<{ index: number; name: string }>;
  perks?: Array<{ milestone: number; name?: string; desc?: string }>;
  rewards?: Array<{ milestone: number; label: string | null }>;
  recurring?: { label: string | null };
}

export const setProgramTexts = (
  clinicId: string,
  programId: string,
  edits: TextEdits,
) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/texts`,
    { method: "PATCH", ...json(edits) },
  );

/** Copies a programme, verbatim, into a new draft. 409 when a draft already exists. */
export const cloneProgramDraft = (clinicId: string, programId: string) =>
  request<ProgramEnvelope>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/draft`,
    { method: "POST" },
  );

export const getRecalibration = (clinicId: string) =>
  request<RecalibrationAdvice>(clinicId, "/recalibration");

/** Five years of what the programme costs and brings in. Computed on the server, which holds the
 *  costs; only yearly totals come back. Absent fields mean the programme's own defaults. */
export const getCalculator = (
  clinicId: string,
  programId: string,
  input: Partial<CalcInput>,
) =>
  request<CalcResult>(
    clinicId,
    `/programs/${encodeURIComponent(programId)}/calculator`,
    {
      method: "POST",
      ...json(input),
    },
  );

/* ---------------------------------------------------------------------------- bonos */

import type {
  BonoPlanRow,
  CreateBonoPlanInput,
  UpdateBonoPlanInput,
} from "@/lib/bono-api";

export const getBonoPlans = (clinicId: string) =>
  request<{ plans: BonoPlanRow[] }>(clinicId, "/bonos").then((r) => r.plans);

export const createBonoPlan = (clinicId: string, input: CreateBonoPlanInput) =>
  request<BonoPlanRow>(clinicId, "/bonos", { method: "POST", ...json(input) });

export const updateBonoPlan = (
  clinicId: string,
  id: string,
  patch: UpdateBonoPlanInput,
) =>
  request<BonoPlanRow>(clinicId, `/bonos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    ...json(patch),
  });

export const deleteBonoPlan = (clinicId: string, id: string) =>
  request<{ status: "deleted" | "retired" }>(
    clinicId,
    `/bonos/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
