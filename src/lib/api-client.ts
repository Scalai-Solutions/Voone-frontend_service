import type { Role } from "@/lib/auth";

export type WalletProvider = "google" | "apple";
export type ProviderStatus = "added" | "not_added" | "unavailable" | "failed";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The backend's machine-readable code, e.g. "MEMBERSHIP_DATA_INVALID". */
    readonly code?: string,
    /**
     * The backend's own message. Its validation errors are written as the Spanish copy a
     * form should show the member, so this is display text rather than debug detail.
     * Absent when the backend marked the error unsafe to expose.
     */
    readonly detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface TemplatePreset {
  id: string;
  name: string;
  hexBackgroundColor: string;
  previewImageUrl?: string | null;
}

export interface TemplateTreatmentInput {
  name: string;
  priceEuro?: number;
  pointsAllotted: number;
}

export interface TierRewardInput {
  name: string;
  rewardText?: string;
}

export interface MilestoneRewardsInput {
  milestoneCount: number;
  pointsToNextMilestone: number;
  priceAmount: number;
  pointsAwarded: number;
}

export interface SaveTemplateInput {
  presetId: string;
  programName: string;
  hexBackgroundColor: string;
  logoUrl?: string;
  heroImageUrl?: string;
  websiteUrl?: string;
  appointmentUrl?: string;
  appLinkText?: string;
  appLinkDescription?: string;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
  treatments: TemplateTreatmentInput[];
}

export interface VooneTemplateButton {
  label: string;
  url: string;
  description?: string;
  primary: boolean;
}

export interface VooneTemplateTextModule {
  label: string;
  value: string;
}

export interface SaveVooneTemplateInput {
  presetId?: string;
  name: string;
  description?: string;
  programName: string;
  hexBackgroundColor: string;
  logoUrl?: string;
  heroImageUrl?: string;
  pointsLabel: string;
  tierLabel: string;
  benefitsText?: string;
  infoText?: string;
  buttons: VooneTemplateButton[];
  textModules: VooneTemplateTextModule[];
}

export interface VooneTemplate extends SaveVooneTemplateInput {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  preset?: TemplatePreset | null;
}

export interface Template {
  id: string;
  clinicId?: string;
  presetId?: string;
  programName: string;
  hexBackgroundColor: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  websiteUrl?: string | null;
  appointmentUrl?: string | null;
  appLinkText?: string | null;
  appLinkDescription?: string | null;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
  status?: "PENDING" | "ACTIVE" | "FAILED";
  preset?: TemplatePreset;
  clinic?: { id: string; name: string };
  treatments?: TemplateTreatmentInput[];
  name?: string;
  clinicBranding?: string;
  backgroundColor?: string;
  benefits?: string;
  memberCount: number;
  walletStatus: Record<WalletProvider, ProviderStatus>;
}

export type VoonePlan = "starter" | "medium" | "pro";

export interface AdminClinicTemplate {
  id: string;
  presetId?: string;
  programName: string;
  hexBackgroundColor: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  websiteUrl?: string | null;
  appointmentUrl?: string | null;
  appLinkText?: string | null;
  appLinkDescription?: string | null;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
  tierRewards: TierRewardInput[];
  milestoneRewards: MilestoneRewardsInput;
  status: "PENDING" | "ACTIVE" | "FAILED";
  walletStatus: Record<WalletProvider, ProviderStatus>;
}

type TemplateApiResponse = Omit<Partial<Template>, "walletStatus"> & {
  id: string;
  programName: string;
  hexBackgroundColor: string;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
  walletClasses?: Array<{ provider: string; status: string }>;
  clinic?: { id: string; name: string; members?: unknown };
};

const emptyWalletStatus = (): Record<WalletProvider, ProviderStatus> => ({
  google: "not_added",
  apple: "not_added",
});

const providerKey = (provider: string): WalletProvider | null => {
  const normalized = provider.toLowerCase();

  return normalized === "google" || normalized === "apple" ? normalized : null;
};

const syncStatusToProviderStatus = (status: string): ProviderStatus => {
  if (status === "SYNCED") return "added";
  if (status === "FAILED") return "failed";
  return "not_added";
};

const normalizeTemplate = (template: TemplateApiResponse): Template => {
  const walletStatus = emptyWalletStatus();

  for (const walletClass of template.walletClasses ?? []) {
    const provider = providerKey(walletClass.provider);

    if (provider) {
      walletStatus[provider] = syncStatusToProviderStatus(walletClass.status);
    }
  }

  return {
    ...template,
    name: template.name ?? template.programName,
    clinicBranding: template.clinicBranding ?? template.clinic?.name,
    backgroundColor: template.backgroundColor ?? template.hexBackgroundColor,
    benefits: template.benefits ?? template.benefitsText,
    memberCount: template.memberCount ?? 0,
    walletStatus,
  };
};

export interface Member {
  id: string;
  name: string;
  identity: string;
  templateId: string;
  templateName: string;
  points: number;
  tier: string;
  walletStatus: Record<WalletProvider, ProviderStatus>;
  history: Array<{ id: string; label: string; points: number; date: string }>;
}

export interface Treatment {
  id: string;
  name: string;
  priceEuro?: number | null;
  points: number;
}

export interface Clinic {
  id: string;
  slug: string;
  name: string;
  addressLine: string;
  pincode: string;
  isActive: boolean;
  privacyPolicyVersion: string;
  voonePlan: VoonePlan;
  notificationsMonthlyQuota: number;
  notificationsUsedThisMonth: number;
  notificationsRemainingThisMonth: number;
  members: number;
  templates: number;
  status: "active" | "setup";
  users: Array<{ id: string; email: string; role: string }>;
  onboardingCredentials?: {
    email: string;
    generatedAt?: string | null;
    sentAt?: string | null;
    hasPassword: boolean;
  } | null;
  treatments?: Treatment[];
  template?: AdminClinicTemplate | null;
}

export interface WalletInfrastructure {
  appleCertificateExpiresAt: string;
  appleEnabled: boolean;
  googlePublishingStatus: "demo" | "live";
  recentErrors: Array<{
    provider: WalletProvider;
    count: number;
    label: string;
  }>;
}

export interface PlatformOverview {
  totalClinics: number;
  totalMembers: number;
  wallet: WalletInfrastructure;
}

export interface DashboardOverview {
  activeMembers: number;
  pointsIssuedThisMonth: number;
  walletAdds: number;
  recentActivity: Array<{ id: string; label: string; date: string }>;
}

export interface CreateMemberInput {
  name: string;
  identity: string;
  templateId: string;
}

const appleEnabled = process.env.NEXT_PUBLIC_APPLE_WALLET_ENABLED === "true";

const mockTemplates: Template[] = [
  {
    id: "gold-beauty",
    clinicId: "clinic-aurea",
    presetId: "classic-gold",
    programName: "Gold Beauty Club",
    hexBackgroundColor: "#ead0bd",
    pointsLabel: "Saldo Beauty",
    tierLabel: "Miembro Gold",
    benefitsText:
      "Reservas prioritarias, bonos de tratamiento para miembros y crédito de cumpleaños.",
    infoText: "Muestra este pase en recepción antes de pagar.",
    status: "ACTIVE",
    treatments: [{ name: "Hydrafacial", pointsAllotted: 120 }],
    name: "Gold Beauty Club",
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: "#ead0bd",
    benefits:
      "Reservas prioritarias, bonos de tratamiento para miembros y crédito de cumpleaños.",
    memberCount: 284,
    walletStatus: {
      google: "added",
      apple: appleEnabled ? "not_added" : "unavailable",
    },
  },
  {
    id: "diamond-skin",
    clinicId: "clinic-aurea",
    presetId: "modern-dark",
    programName: "Diamond Skin Plan",
    hexBackgroundColor: "#2f343a",
    pointsLabel: "Crédito Skin",
    tierLabel: "Miembro Diamond",
    benefitsText: "Revisión avanzada, horarios VIP y lanzamientos exclusivos.",
    infoText:
      "Los puntos se actualizan después de cada tratamiento completado.",
    status: "ACTIVE",
    treatments: [{ name: "Sesión láser", pointsAllotted: 220 }],
    name: "Diamond Skin Plan",
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: "#2f343a",
    benefits: "Revisión avanzada, horarios VIP y lanzamientos exclusivos.",
    memberCount: 71,
    walletStatus: {
      google: "added",
      apple: appleEnabled ? "not_added" : "unavailable",
    },
  },
];

const mockTemplatePresets: TemplatePreset[] = [
  { id: "classic-gold", name: "Classic Gold", hexBackgroundColor: "#ead0bd" },
  { id: "modern-dark", name: "Modern Dark", hexBackgroundColor: "#2a2e35" },
  { id: "fresh-mint", name: "Fresh Mint", hexBackgroundColor: "#d8efe3" },
];

const mockMembers: Member[] = [
  {
    id: "MEM-1048",
    name: "Veronica Navarro",
    identity: "+34 612 440 901",
    templateId: "gold-beauty",
    templateName: "Gold Beauty Club",
    points: 1250,
    tier: "Gold",
    walletStatus: {
      google: "added",
      apple: appleEnabled ? "not_added" : "unavailable",
    },
    history: [
      { id: "h1", label: "Hydrafacial", points: 120, date: "2026-09-04" },
      { id: "h2", label: "Bono por referido", points: 80, date: "2026-08-22" },
    ],
  },
  {
    id: "MEM-2033",
    name: "Mateo Ruiz",
    identity: "mateo@example.com",
    templateId: "diamond-skin",
    templateName: "Diamond Skin Plan",
    points: 2480,
    tier: "Diamond",
    walletStatus: {
      google: "not_added",
      apple: appleEnabled ? "not_added" : "unavailable",
    },
    history: [
      { id: "h3", label: "Sesión láser", points: 220, date: "2026-09-02" },
    ],
  },
  {
    id: "MEM-3110",
    name: "Lucia Gomez",
    identity: "+34 699 120 441",
    templateId: "gold-beauty",
    templateName: "Gold Beauty Club",
    points: 540,
    tier: "Silver",
    walletStatus: {
      google: "added",
      apple: appleEnabled ? "failed" : "unavailable",
    },
    history: [
      {
        id: "h4",
        label: "Crédito de bienvenida",
        points: 100,
        date: "2026-08-18",
      },
    ],
  },
];

const mockTreatments: Treatment[] = [
  { id: "hydrafacial", name: "Hydrafacial", points: 120 },
  { id: "laser", name: "Sesión láser", points: 220 },
  { id: "consult", name: "Consulta", points: 60 },
  { id: "peel", name: "Peeling", points: 90 },
];

const mockClinics: Clinic[] = [];

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_VOONE_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_VOONE_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone API request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Calls this app's own route handlers rather than the backend.
 *
 * Relative by design: the handler runs on our server, holds STAFF_API_KEY, and derives the
 * clinic from the session — so the browser never sees the key and cannot choose the clinic.
 * Browser-only for the same reason a relative URL is: every caller is a client component.
 *
 * No mock fallback. These are writes, and a write that reports success while persisting
 * nothing is the failure mode worth avoiding most.
 */
async function proxyFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Voone staff request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

/** Staff-scoped calls: /api/staff/<path>. */
const staffProxyFetch = <T>(path: string, init: RequestInit) =>
  proxyFetch<T>(`/staff${path}`, init);

/** Voone-admin calls: /api/admin/<path>. A different surface with a different guard. */
const adminProxyFetch = <T>(path: string, init: RequestInit = {}) =>
  proxyFetch<T>(`/admin${path}`, init);

async function withMockFallback<T>(
  request: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    // A 404 means the backend does not implement this endpoint yet, which is precisely the
    // case these fallbacks exist for — most of the dashboard reads against routes that have
    // never been built. Anything else is a real failure and still propagates: a 500 or a
    // 403 must not be quietly replaced with fabricated data.
    //
    // Needed as soon as NEXT_PUBLIC_VOONE_API_URL was configured. Before that the missing
    // variable threw something that was not an ApiError, so every read fell back and the
    // dashboard rendered; pointing it at a real backend turned those reads into 404s and
    // took the pages down with a 500.
    if (error instanceof ApiError && error.status !== 404) {
      throw error;
    }

    return fallback;
  }
}

export function getTemplates() {
  return apiFetch<TemplateApiResponse[]>("/v1/templates").then((templates) =>
    templates.map(normalizeTemplate),
  );
}

export function getTemplatePresets() {
  return withMockFallback(
    () => apiFetch<TemplatePreset[]>("/v1/templates/presets"),
    mockTemplatePresets,
  );
}

export function getVooneTemplates() {
  return apiFetch<VooneTemplate[]>("/v1/voone-templates");
}

export function getVooneTemplate(templateId: string) {
  return apiFetch<VooneTemplate>(
    `/v1/voone-templates/${encodeURIComponent(templateId)}`,
  );
}

export function getCurrentClinicTemplate(clinicId: string) {
  return withMockFallback(
    () =>
      apiFetch<TemplateApiResponse | null>(
        `/v1/templates/current?clinicId=${encodeURIComponent(clinicId)}`,
      ).then((template) => (template ? normalizeTemplate(template) : null)),
    null,
  );
}

export function getTemplate(templateId: string) {
  return apiFetch<TemplateApiResponse>(`/v1/templates/${templateId}`).then(
    normalizeTemplate,
  );
}

/**
 * Creates or updates the clinic's template.
 *
 * Routed through this app's server so the write carries STAFF_API_KEY without the browser
 * holding it, and so the clinic is taken from the session rather than this argument — the
 * clinicId argument is therefore ignored, and kept only so the existing call sites in
 * template-form.tsx need no change.
 *
 * The mock fallback is gone. It used to return a fabricated Template when the request
 * failed for any reason other than an HTTP status, which meant a clinic could redesign its
 * pass, see the change confirmed, and have nothing saved.
 */
export function saveTemplate(
  input: SaveTemplateInput,
  templateId: string | undefined,
  clinicId: string,
) {
  void clinicId;

  return staffProxyFetch<Template>(
    templateId ? `/templates/${templateId}` : "/templates",
    {
      method: templateId ? "PATCH" : "POST",
      body: JSON.stringify(input),
    },
  );
}

export function saveAdminTemplate(
  input: SaveTemplateInput,
  templateId: string | undefined,
  clinicId: string,
) {
  return adminProxyFetch<Template>(
    templateId ? `/templates/${templateId}` : "/templates",
    {
      method: templateId ? "PATCH" : "POST",
      body: JSON.stringify({ ...input, clinicId }),
    },
  );
}

export function saveAdminVooneTemplate(
  input: SaveVooneTemplateInput,
  templateId?: string,
) {
  return adminProxyFetch<VooneTemplate>(
    templateId
      ? `/voone-templates/${encodeURIComponent(templateId)}`
      : "/voone-templates",
    {
      method: templateId ? "PATCH" : "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getMembers() {
  return withMockFallback(() => apiFetch<Member[]>("/v1/members"), mockMembers);
}

export function getAdminMembers() {
  return adminProxyFetch<Member[]>("/members");
}

export function getMember(memberId: string) {
  return withMockFallback(
    () => apiFetch<Member>(`/v1/members/${memberId}`),
    mockMembers.find((member) => member.id === memberId) ?? mockMembers[0],
  );
}

export function createMember(input: CreateMemberInput) {
  const template =
    mockTemplates.find((item) => item.id === input.templateId) ??
    mockTemplates[0];
  const fallback: Member & { walletLink: string } = {
    id: `MEM-${Math.floor(4000 + Math.random() * 5000)}`,
    name: input.name,
    identity: input.identity,
    templateId: template.id,
    templateName: template.name ?? template.programName,
    points: 0,
    tier: "Nuevo",
    walletStatus: {
      google: "not_added",
      apple: appleEnabled ? "not_added" : "unavailable",
    },
    history: [],
    walletLink: "https://voone.example/wallet/add/demo",
  };

  return withMockFallback(
    () =>
      apiFetch<Member & { walletLink: string }>("/v1/members", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    fallback,
  );
}

export function getTreatments() {
  return withMockFallback(
    () => apiFetch<Treatment[]>("/v1/points/treatments"),
    mockTreatments,
  );
}

export function creditMember(
  memberId: string,
  points: number,
  label: string,
  referralCode?: string,
) {
  const member =
    mockMembers.find((item) => item.id === memberId) ?? mockMembers[0];
  const fallback: Member = {
    ...member,
    points: member.points + points,
    history: [
      {
        id: "optimistic",
        label,
        points,
        date: new Date().toISOString().slice(0, 10),
      },
      ...member.history,
    ],
  };

  return withMockFallback(
    () =>
      apiFetch<Member>(`/v1/members/${memberId}/points`, {
        method: "POST",
        body: JSON.stringify({ points, label, referralCode }),
      }),
    fallback,
  );
}

export function getDashboardOverview() {
  const fallback: DashboardOverview = {
    activeMembers: 355,
    pointsIssuedThisMonth: 18840,
    walletAdds: 302,
    recentActivity: [
      { id: "a1", label: "Verónica ganó 120 puntos", date: "Hoy" },
      { id: "a2", label: "Mateo se unió a Diamond Skin Plan", date: "Ayer" },
      {
        id: "a3",
        label: "Plantilla Gold Beauty Club actualizada",
        date: "2 sep",
      },
    ],
  };

  return withMockFallback(
    () => apiFetch<DashboardOverview>("/v1/dashboard/overview"),
    fallback,
  );
}

export function getClinics() {
  return adminProxyFetch<Clinic[]>("/clinics");
}

export function getClinic(clinicId: string) {
  return adminProxyFetch<Clinic>(`/clinics/${encodeURIComponent(clinicId)}`);
}

export function getWalletInfrastructure() {
  const fallback: WalletInfrastructure = {
    appleCertificateExpiresAt: "2027-02-14T00:00:00.000Z",
    appleEnabled,
    googlePublishingStatus: "demo",
    recentErrors: [
      { provider: "google", count: 2, label: "Errores al guardar enlaces" },
      { provider: "apple", count: 0, label: "Errores al crear pases" },
    ],
  };

  return withMockFallback(
    () => apiFetch<WalletInfrastructure>("/v1/admin/wallet"),
    fallback,
  );
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const wallet = await getWalletInfrastructure();

  return withMockFallback(
    () => apiFetch<PlatformOverview>("/v1/admin/overview"),
    {
      totalClinics: mockClinics.length,
      totalMembers: mockClinics.reduce(
        (total, clinic) => total + clinic.members,
        0,
      ),
      wallet,
    },
  );
}

export function canShowAction(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}
// --- Public membership sign-up ---------------------------------------------------------
//
// Nothing below is wrapped in withMockFallback, and that is the point. That helper returns
// fabricated data when a request fails for any reason other than an HTTP status — a missing
// NEXT_PUBLIC_VOONE_API_URL, or the backend simply being down. For a read on a mocked
// dashboard that is a convenience; for a sign-up it would tell a clinic the member was
// registered while persisting nothing. These throw instead, and the form renders the failure.

export interface PublicClinicTemplate {
  programName: string;
  hexBackgroundColor: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
}

export interface PublicClinic {
  slug: string;
  name: string;
  privacyPolicyVersion: string;
  template: PublicClinicTemplate;
}

export interface MembershipSignupInput {
  name: string;
  /**
   * Sent exactly as typed, NOT pre-normalized. Member.phoneRaw preserves the original so a
   * future change to the normalization rules is a backfill rather than data loss; the
   * backend canonicalizes and is the authority.
   */
  phone: string;
  /** Optional additional contact. The phone is the identity. */
  email?: string;
  /**
   * Year of birth, not an age: an age is wrong within a year of being stored and nothing
   * would ever correct it. Optional — refusing a sign-up over a demographic costs a
   * member to gain a data point.
   */
  birthYear?: number;
  /** Self-declared. "prefiero_no_decirlo" is a real answer, not an absent field. */
  sex?: "mujer" | "hombre" | "otro" | "prefiero_no_decirlo";
  consentMarketing: boolean;
  /** Omitted for the public form, which the backend reads as a QR sign-up. */
  consentSource?: "qr_signup" | "staff_entry";
}

/** Branding for a clinic's public sign-up page. Throws ApiError(404) for an unknown slug. */
export async function getPublicClinic(slug: string) {
  const { clinic } = await apiFetch<{ clinic: PublicClinic }>(
    `/v1/clinics/${encodeURIComponent(slug)}`,
  );

  return clinic;
}

/**
 * Registers a member of a clinic.
 *
 * Idempotent per clinic: submitting a number that is already a member returns the same
 * response as a new one. The backend deliberately makes the two indistinguishable, so there
 * is nothing here to branch on and nothing to report back beyond success.
 */
export async function signUpMember(slug: string, input: MembershipSignupInput) {
  return apiFetch<{ status: "ok" }>(
    `/v1/clinics/${encodeURIComponent(slug)}/members`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

/**
 * Registers a member that staff entered at reception, rather than one who signed
 * themselves up.
 *
 * consentMarketing is forced to false and cannot be set by the caller: staff cannot consent
 * to marketing on a client's behalf, so the only honest value is "no". A client who wants it
 * opts in through the public form, which is the one place the choice is actually theirs.
 */
export async function addMemberAsStaff(input: {
  name: string;
  phone: string;
  email?: string;
}) {
  // No clinic argument: the route handler takes it from the session, so a signed-in member
  // of one clinic cannot enrol someone into another. consentMarketing and consentSource are
  // set there too, for the same reason — a caller must not describe its own provenance.
  return staffProxyFetch<{ status: "ok" }>("/members", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Clinic provisioning ---------------------------------------------------------------

export interface ProvisionClinicInput {
  slug: string;
  name: string;
  addressLine: string;
  pincode: string;
  ownerName?: string;
  ownerEmail?: string;
  presetId: string;
  programName: string;
  hexBackgroundColor?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  websiteUrl?: string;
  appointmentUrl?: string;
  appLinkText?: string;
  appLinkDescription?: string;
  pointsLabel?: string;
  tierLabel?: string;
  benefitsText?: string;
  infoText?: string;
  treatments?: TemplateTreatmentInput[];
  tierRewards?: TierRewardInput[];
  milestoneRewards?: MilestoneRewardsInput;
}

export interface ProvisionedClinic {
  clinic: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
    privacyPolicyVersion: string;
  };
  template: {
    id: string;
    programName: string;
    hexBackgroundColor: string;
    status: string;
  };
}

/**
 * Creates a clinic and its template.
 *
 * Through this app's own server, so the write carries STAFF_API_KEY without the browser
 * holding it and the voone_admin check happens where a client cannot skip it. No mock
 * fallback: onboarding a clinic that was never created is the worst possible thing to
 * report as success, since the next step is printing a poster for it.
 */
export async function provisionClinic(input: ProvisionClinicInput) {
  return adminProxyFetch<ProvisionedClinic>("/clinics", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
