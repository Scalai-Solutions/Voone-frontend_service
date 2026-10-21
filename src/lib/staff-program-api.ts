import { ApiError } from "@/lib/api-client";
import type { CategoryCode, PresentedProgram } from "@/lib/onboarding-api";

/**
 * What a centre's own staff do with a loyalty programme day to day: see whether it has one,
 * record a visit, and redeem what a member has earned.
 *
 * Nothing here carries a cost. The backend's staff routes are built without one, and these
 * types have nowhere to put one.
 */

export interface StaffProgram {
  version: number;
  publishedAt: string | null;
  program: PresentedProgram;
}

export interface VisitLineInput {
  category?: CategoryCode;
  amountEuro: number;
}

export type VisitInput =
  | {
      kind: "PAYMENT";
      lines: VisitLineInput[];
      discountedProducts?: number;
      idempotencyKey: string;
    }
  | {
      kind: "BONO_SESSION";
      package: { name?: string; priceEuro: number; sessions: number };
      idempotencyKey: string;
    };

export interface IssuedReward {
  id: string;
  kind: string;
  title: string;
  expiresAt: string;
}

export interface VisitOutcome {
  visitId: string;
  duplicate: boolean;
  progress: number;
  /** The visit as the client sees it: ten points per euro. */
  points: number;
  /** Total after this visit, in points. */
  pointsTotal: number;
  doubled: boolean;
  lifetimeBefore: number;
  lifetimeAfter: number;
  tier: string | null;
  issued: IssuedReward[];
  discountRemaining: number;
}

export interface MemberReward {
  id: string;
  kind: string;
  title: string;
  detail: { perk?: string; pool?: Array<{ id: string; name?: string }> } | null;
  issuedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  surpriseItem: string | null;
  status: "disponible" | "canjeado" | "caducado";
}

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
      `Staff programme request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

/** The centre's live programme, or null when it is still on the older points scheme. */
export const getStaffProgram = async (): Promise<StaffProgram | null> => {
  try {
    return await request<StaffProgram>("/program");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    throw error;
  }
};

export interface StaffCatalogItem {
  externalId: string;
  name: string;
  priceEuro: number;
  category: CategoryCode | null;
  isProduct: boolean;
}

/** The centre's own catalogue, for choosing what was paid instead of typing it. */
export const getStaffCatalog = () =>
  request<{ items: StaffCatalogItem[] }>("/catalog").then((r) => r.items);

export const recordVisit = (memberId: string, input: VisitInput) =>
  request<VisitOutcome>(`/members/${encodeURIComponent(memberId)}/visits`, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const getMemberRewards = (memberId: string) =>
  request<{ rewards: MemberReward[] }>(`/members/${encodeURIComponent(memberId)}/rewards`).then(
    (r) => r.rewards,
  );

export const redeemReward = (
  memberId: string,
  rewardId: string,
  input: { visitId: string; surpriseItem?: string },
) =>
  request<unknown>(
    `/members/${encodeURIComponent(memberId)}/rewards/${encodeURIComponent(rewardId)}/redeem`,
    { method: "POST", body: JSON.stringify(input) },
  );
