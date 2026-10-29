import { ApiError } from "@/lib/api-client";
import {
  normalizeDoublePoints,
  type DoublePoints,
  type DoubleReason,
} from "@/lib/double-points";
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

export type BoostMultiplier = 2 | 3 | 5 | 10;

export type VisitInput =
  | {
      kind: "PAYMENT";
      lines: VisitLineInput[];
      discountedProducts?: number;
      /** Optional hand-awarded gift, in points (multiples of 10). */
      bonusPoints?: number;
      /**
       * Set when `bonusPoints` comes from the x2/x3/x5/x10 slider. The backend ignores that
       * extra while a x2 already applies, so the visit is never doubled twice.
       */
      boostMultiplier?: BoostMultiplier;
      idempotencyKey: string;
    }
  | {
      kind: "BONO_SESSION";
      /** The plan to start, or the member's active bono from it. */
      planId?: string;
      /** The member's bono directly. */
      memberBonoId?: string;
      /** Legacy free-text package, recorded with no bono to track. */
      package?: { name?: string; priceEuro: number; sessions: number };
      /** For a client who already did sessions elsewhere before tracking started here. */
      startAtSession?: number;
      bonusPoints?: number;
      boostMultiplier?: BoostMultiplier;
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
  /** Why the visit was doubled; null when it was not (or on an older backend). */
  doubleReason?: DoubleReason | null;
  lifetimeBefore: number;
  lifetimeAfter: number;
  tier: string | null;
  issued: IssuedReward[];
  discountRemaining: number;
  /** The bono the session came out of; null for a payment visit or a legacy package. */
  bono: {
    id: string;
    name: string;
    session: number;
    total: number;
    remaining: number;
    status: "ACTIVE" | "COMPLETED";
  } | null;
  /** Whole points the progress gained from the bonus field, 0 when there was none. */
  bonusPoints: number;
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

export interface MemberRewardsOverview {
  rewards: MemberReward[];
  /** Whether the member's next payment earns double; nothing applies on an older backend. */
  doublePoints: DoublePoints;
}

/** A member's rewards plus whether their next payment earns double points. */
export const getMemberRewardsOverview = (
  memberId: string,
): Promise<MemberRewardsOverview> =>
  request<{ rewards?: MemberReward[]; doublePoints?: unknown }>(
    `/members/${encodeURIComponent(memberId)}/rewards`,
  ).then((r) => ({
    rewards: r.rewards ?? [],
    doublePoints: normalizeDoublePoints(r.doublePoints),
  }));

/** Just the rewards list, for callers that do not care about double points. */
export const getMemberRewards = (memberId: string) =>
  getMemberRewardsOverview(memberId).then((r) => r.rewards);

export const redeemReward = (
  memberId: string,
  rewardId: string,
  input: { visitId: string; surpriseItem?: string },
) =>
  request<unknown>(
    `/members/${encodeURIComponent(memberId)}/rewards/${encodeURIComponent(rewardId)}/redeem`,
    { method: "POST", body: JSON.stringify(input) },
  );
