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
    readonly detail?: string
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
  pointsAllotted: number;
}

export interface SaveTemplateInput {
  presetId: string;
  programName: string;
  hexBackgroundColor: string;
  logoUrl?: string;
  heroImageUrl?: string;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
  treatments: TemplateTreatmentInput[];
}

export interface Template {
  id: string;
  clinicId?: string;
  presetId?: string;
  programName: string;
  hexBackgroundColor: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
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
  points: number;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  plan: string;
  members: number;
  templates: number;
  status: "active" | "setup";
}

export interface WalletInfrastructure {
  appleCertificateExpiresAt: string;
  appleEnabled: boolean;
  googlePublishingStatus: "demo" | "live";
  recentErrors: Array<{ provider: WalletProvider; count: number; label: string }>;
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
    benefitsText: "Reservas prioritarias, bonos de tratamiento para miembros y crédito de cumpleaños.",
    infoText: "Muestra este pase en recepción antes de pagar.",
    status: "ACTIVE",
    treatments: [{ name: "Hydrafacial", pointsAllotted: 120 }],
    name: "Gold Beauty Club",
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: "#ead0bd",
    benefits: "Reservas prioritarias, bonos de tratamiento para miembros y crédito de cumpleaños.",
    memberCount: 284,
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
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
    infoText: "Los puntos se actualizan después de cada tratamiento completado.",
    status: "ACTIVE",
    treatments: [{ name: "Sesión láser", pointsAllotted: 220 }],
    name: "Diamond Skin Plan",
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: "#2f343a",
    benefits: "Revisión avanzada, horarios VIP y lanzamientos exclusivos.",
    memberCount: 71,
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
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
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
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
    walletStatus: { google: "not_added", apple: appleEnabled ? "not_added" : "unavailable" },
    history: [{ id: "h3", label: "Sesión láser", points: 220, date: "2026-09-02" }],
  },
  {
    id: "MEM-3110",
    name: "Lucia Gomez",
    identity: "+34 699 120 441",
    templateId: "gold-beauty",
    templateName: "Gold Beauty Club",
    points: 540,
    tier: "Silver",
    walletStatus: { google: "added", apple: appleEnabled ? "failed" : "unavailable" },
    history: [{ id: "h4", label: "Crédito de bienvenida", points: 100, date: "2026-08-18" }],
  },
];

const mockTreatments: Treatment[] = [
  { id: "hydrafacial", name: "Hydrafacial", points: 120 },
  { id: "laser", name: "Sesión láser", points: 220 },
  { id: "consult", name: "Consulta", points: 60 },
  { id: "peel", name: "Peeling", points: 90 },
];

const mockClinics: Clinic[] = [
  { id: "clinic-aurea", name: "Clínica Aurea", city: "Madrid", plan: "Growth", members: 355, templates: 2, status: "active" },
  { id: "clinic-luma", name: "Luma Skin Studio", city: "Valencia", plan: "Launch", members: 82, templates: 1, status: "setup" },
  { id: "clinic-nova", name: "Nova Esthetics", city: "Barcelona", plan: "Growth", members: 510, templates: 3, status: "active" },
];

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
    const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    throw new ApiError(
      `Voone API request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message
    );
  }

  return response.json() as Promise<T>;
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    return fallback;
  }
}

export function getTemplates() {
  return withMockFallback(() => apiFetch<Template[]>("/v1/wallet/templates"), mockTemplates);
}

export function getTemplatePresets() {
  return withMockFallback(() => apiFetch<TemplatePreset[]>("/v1/templates/presets"), mockTemplatePresets);
}

export function getCurrentClinicTemplate(clinicId: string) {
  return withMockFallback(() => apiFetch<Template | null>(`/v1/templates/current?clinicId=${encodeURIComponent(clinicId)}`), null);
}

export function getTemplate(templateId: string) {
  return withMockFallback(
    () => apiFetch<Template>(`/v1/templates/${templateId}`),
    mockTemplates.find((template) => template.id === templateId) ?? mockTemplates[0]
  );
}

export function saveTemplate(input: SaveTemplateInput, templateId: string | undefined, clinicId: string) {
  const fallback: Template = {
    id: templateId ?? "new-template",
    clinicId,
    ...input,
    name: input.programName,
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: input.hexBackgroundColor,
    benefits: input.benefitsText,
    memberCount: templateId ? mockTemplates.find((template) => template.id === templateId)?.memberCount ?? 0 : 0,
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
  };

  return withMockFallback(
    () =>
      apiFetch<Template>(templateId ? `/v1/templates/${templateId}` : "/v1/templates", {
        method: templateId ? "PATCH" : "POST",
        headers: { "x-clinic-id": clinicId },
        body: JSON.stringify(input),
      }),
    fallback
  );
}

export function getMembers() {
  return withMockFallback(() => apiFetch<Member[]>("/v1/members"), mockMembers);
}

export function getMember(memberId: string) {
  return withMockFallback(
    () => apiFetch<Member>(`/v1/members/${memberId}`),
    mockMembers.find((member) => member.id === memberId) ?? mockMembers[0]
  );
}

export function createMember(input: CreateMemberInput) {
  const template = mockTemplates.find((item) => item.id === input.templateId) ?? mockTemplates[0];
  const fallback: Member & { walletLink: string } = {
    id: `MEM-${Math.floor(4000 + Math.random() * 5000)}`,
    name: input.name,
    identity: input.identity,
    templateId: template.id,
    templateName: template.name ?? template.programName,
    points: 0,
    tier: "Nuevo",
    walletStatus: { google: "not_added", apple: appleEnabled ? "not_added" : "unavailable" },
    history: [],
    walletLink: "https://voone.example/wallet/add/demo",
  };

  return withMockFallback(
    () =>
      apiFetch<Member & { walletLink: string }>("/v1/members", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    fallback
  );
}

export function getTreatments() {
  return withMockFallback(() => apiFetch<Treatment[]>("/v1/points/treatments"), mockTreatments);
}

export function creditMember(memberId: string, points: number, label: string, referralCode?: string) {
  const member = mockMembers.find((item) => item.id === memberId) ?? mockMembers[0];
  const fallback: Member = {
    ...member,
    points: member.points + points,
    history: [{ id: "optimistic", label, points, date: new Date().toISOString().slice(0, 10) }, ...member.history],
  };

  return withMockFallback(
    () =>
      apiFetch<Member>(`/v1/members/${memberId}/points`, {
        method: "POST",
        body: JSON.stringify({ points, label, referralCode }),
      }),
    fallback
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
      { id: "a3", label: "Plantilla Gold Beauty Club actualizada", date: "2 sep" },
    ],
  };

  return withMockFallback(() => apiFetch<DashboardOverview>("/v1/dashboard/overview"), fallback);
}

export function getClinics() {
  return withMockFallback(() => apiFetch<Clinic[]>("/v1/admin/clinics"), mockClinics);
}

export function getClinic(clinicId: string) {
  return withMockFallback(
    () => apiFetch<Clinic>(`/v1/admin/clinics/${clinicId}`),
    mockClinics.find((clinic) => clinic.id === clinicId) ?? mockClinics[0]
  );
}

export function createClinic(input: Pick<Clinic, "name" | "city" | "plan">) {
  const fallback: Clinic = {
    id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    ...input,
    members: 0,
    templates: 0,
    status: "setup",
  };

  return withMockFallback(
    () =>
      apiFetch<Clinic>("/v1/admin/clinics", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    fallback
  );
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

  return withMockFallback(() => apiFetch<WalletInfrastructure>("/v1/admin/wallet"), fallback);
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const wallet = await getWalletInfrastructure();

  return withMockFallback(() => apiFetch<PlatformOverview>("/v1/admin/overview"), {
    totalClinics: mockClinics.length,
    totalMembers: mockClinics.reduce((total, clinic) => total + clinic.members, 0),
    wallet,
  });
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
  consentMarketing: boolean;
  /** Omitted for the public form, which the backend reads as a QR sign-up. */
  consentSource?: "qr_signup" | "staff_entry";
}

/** Branding for a clinic's public sign-up page. Throws ApiError(404) for an unknown slug. */
export async function getPublicClinic(slug: string) {
  const { clinic } = await apiFetch<{ clinic: PublicClinic }>(`/v1/clinics/${encodeURIComponent(slug)}`);

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
  return apiFetch<{ status: "ok" }>(`/v1/clinics/${encodeURIComponent(slug)}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Registers a member that staff entered at reception, rather than one who signed
 * themselves up.
 *
 * consentMarketing is forced to false and cannot be set by the caller: staff cannot consent
 * to marketing on a client's behalf, so the only honest value is "no". A client who wants it
 * opts in through the public form, which is the one place the choice is actually theirs.
 */
export async function addMemberAsStaff(
  slug: string,
  input: { name: string; phone: string; email?: string }
) {
  return signUpMember(slug, {
    ...input,
    consentMarketing: false,
    consentSource: "staff_entry",
  });
}
