import { ApiError } from "@/lib/api-client";

/**
 * Bono de sesiones, as the centre's own staff call it: the plans the owner defines and the
 * bonos members hold. Every call goes through this app's own /api/staff route handlers,
 * which hold the staff key and take the clinic from the session — the browser never talks
 * to the backend directly.
 */

export interface BonoPlanRow {
  id: string;
  name: string;
  pricePerSessionEuro: number;
  totalSessions: number;
  /** Derived: what the whole pack costs. */
  totalEuro: number;
  active: boolean;
  /** How many members hold a bono from this plan, including finished ones. */
  issuedCount: number;
}

export interface MemberBonoRow {
  id: string;
  planId: string | null;
  name: string;
  pricePerSessionEuro: number;
  totalSessions: number;
  sessionsUsed: number;
  remaining: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startedAt: string;
  cancelledAt: string | null;
}

export interface CreateBonoPlanInput {
  name: string;
  /** The whole pack: what the client pays. The per-session figure is derived from it. */
  priceEuro: number;
  totalSessions: number;
}

export type UpdateBonoPlanInput = Partial<CreateBonoPlanInput> & { active?: boolean };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/staff${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Bono request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

export const getBonoPlans = () =>
  request<{ plans: BonoPlanRow[] }>("/bonos").then((r) => r.plans);

export const createBonoPlan = (input: CreateBonoPlanInput) =>
  request<BonoPlanRow>("/bonos", { method: "POST", body: JSON.stringify(input) });

export const updateBonoPlan = (id: string, patch: UpdateBonoPlanInput) =>
  request<BonoPlanRow>(`/bonos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const deleteBonoPlan = (id: string) =>
  request<{ status: "deleted" | "retired" }>(`/bonos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

/** A member's bonos, with how far through each they are. */
export const getMemberBonos = (memberId: string) =>
  request<{ bonos: MemberBonoRow[] }>(`/members/${encodeURIComponent(memberId)}/bonos`).then(
    (r) => r.bonos,
  );

export const cancelMemberBono = (memberId: string, bonoId: string) =>
  request<MemberBonoRow>(
    `/members/${encodeURIComponent(memberId)}/bonos/${encodeURIComponent(bonoId)}/cancel`,
    { method: "POST" },
  );
