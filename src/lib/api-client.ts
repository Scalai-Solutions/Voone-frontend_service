import type { Role } from "@/lib/auth";

export type WalletProvider = "google" | "apple";
export type ProviderStatus = "added" | "not_added" | "unavailable" | "failed";

export interface Template {
  id: string;
  name: string;
  clinicBranding: string;
  backgroundColor: string;
  pointsLabel: string;
  tierLabel: string;
  benefits: string;
  infoText: string;
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

export interface SaveTemplateInput {
  name: string;
  clinicBranding: string;
  backgroundColor: string;
  pointsLabel: string;
  tierLabel: string;
  benefits: string;
  infoText: string;
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
    name: "Gold Beauty Club",
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: "#ead0bd",
    pointsLabel: "Saldo Beauty",
    tierLabel: "Miembro Gold",
    benefits: "Reservas prioritarias, bonos de tratamiento para miembros y crédito de cumpleaños.",
    infoText: "Muestra este pase en recepción antes de pagar.",
    memberCount: 284,
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
  },
  {
    id: "diamond-skin",
    name: "Diamond Skin Plan",
    clinicBranding: "Club Clínica Aurea",
    backgroundColor: "#2f343a",
    pointsLabel: "Crédito Skin",
    tierLabel: "Miembro Diamond",
    benefits: "Revisión avanzada, horarios VIP y lanzamientos exclusivos.",
    infoText: "Los puntos se actualizan después de cada tratamiento completado.",
    memberCount: 71,
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
  },
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
    throw new Error(`Voone API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch {
    return fallback;
  }
}

export function getTemplates() {
  return withMockFallback(() => apiFetch<Template[]>("/v1/wallet/templates"), mockTemplates);
}

export function getTemplate(templateId: string) {
  return withMockFallback(
    () => apiFetch<Template>(`/v1/wallet/templates/${templateId}`),
    mockTemplates.find((template) => template.id === templateId) ?? mockTemplates[0]
  );
}

export function saveTemplate(input: SaveTemplateInput, templateId?: string) {
  const fallback: Template = {
    id: templateId ?? "new-template",
    ...input,
    memberCount: templateId ? mockTemplates.find((template) => template.id === templateId)?.memberCount ?? 0 : 0,
    walletStatus: { google: "added", apple: appleEnabled ? "not_added" : "unavailable" },
  };

  return withMockFallback(
    () =>
      apiFetch<Template>(templateId ? `/v1/wallet/templates/${templateId}` : "/v1/wallet/templates", {
        method: templateId ? "PUT" : "POST",
        body: JSON.stringify({ providers: ["google", ...(appleEnabled ? ["apple"] : [])], ...input }),
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
    templateName: template.name,
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