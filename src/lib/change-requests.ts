/**
 * Change requests ("tickets") as the admin portal sees them.
 *
 * Pure and dependency-free so both the browser, the route handlers and the unit tests
 * can import it. The shapes mirror the backend's admin views exactly
 * (`src/modules/change-requests/service.ts`): written out here, not inferred, so a change
 * on the backend shows up as a type error in the screens instead of a blank cell.
 */

export const CHANGE_REQUEST_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const CHANGE_REQUEST_TYPES = [
  "REWARD",
  "LEVEL",
  "SERVICE_EDIT",
  "SERVICE_ADD",
  "SERVICE_REMOVE",
  "BONO",
  "OTHER",
] as const;
export type ChangeRequestType = (typeof CHANGE_REQUEST_TYPES)[number];

export type AuthorKind = "CLINIC" | "VOONE";

export interface ChangeRequestClinicRef {
  id: string;
  name: string;
  slug: string;
}

export interface ChangeRequestMessage {
  id: string;
  authorKind: AuthorKind;
  authorEmail: string;
  body: string;
  createdAt: string;
}

export interface ChangeRequest {
  id: string;
  clinicId: string;
  clinic: ChangeRequestClinicRef;
  type: ChangeRequestType;
  targetRef: unknown;
  title: string;
  reason: string;
  proposed: unknown;
  status: ChangeRequestStatus;
  createdByEmail: string;
  createdByRole: string;
  resolvedByEmail: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  programId: string | null;
  emailSentAt: string | null;
  lastEmailError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestListItem extends ChangeRequest {
  messageCount: number;
  lastMessageAt: string | null;
}

export interface ChangeRequestDetail extends ChangeRequest {
  messages: ChangeRequestMessage[];
  /** Warnings about the clinic's active programme; null when there is nothing to say. */
  catalogueImpact: string[] | null;
}

export interface ChangeRequestPage {
  items: ChangeRequestListItem[];
  nextCursor: string | null;
}

export type AppliedAction =
  | "created"
  | "updated"
  | "removed"
  | "deleted"
  | "retired";

export interface ApplyResult {
  request: ChangeRequestDetail;
  applied: {
    kind: "treatment" | "bono";
    action: AppliedAction;
    summary: string;
  };
  warnings: string[];
}

export interface DraftResult {
  request: ChangeRequestDetail;
  programId: string;
}

export const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export const TYPE_LABEL: Record<ChangeRequestType, string> = {
  REWARD: "Reward",
  LEVEL: "Level",
  SERVICE_EDIT: "Service change",
  SERVICE_ADD: "New service",
  SERVICE_REMOVE: "Remove service",
  BONO: "Session voucher",
  OTHER: "Other",
};

export const isChangeRequestStatus = (
  value: unknown,
): value is ChangeRequestStatus =>
  typeof value === "string" &&
  (CHANGE_REQUEST_STATUSES as readonly string[]).includes(value);

export const isChangeRequestType = (
  value: unknown,
): value is ChangeRequestType =>
  typeof value === "string" &&
  (CHANGE_REQUEST_TYPES as readonly string[]).includes(value);

/** OPEN or IN_PROGRESS: the tickets that still need Voone's attention. */
export const isUnresolved = (status: ChangeRequestStatus): boolean =>
  status === "OPEN" || status === "IN_PROGRESS";

/** The tickets "Apply change" can carry out. */
export const canApplyType = (type: ChangeRequestType): boolean =>
  type === "SERVICE_ADD" ||
  type === "SERVICE_EDIT" ||
  type === "SERVICE_REMOVE" ||
  type === "BONO";

/** The tickets "Create programme draft" is for. */
export const canDraftType = (type: ChangeRequestType): boolean =>
  type === "REWARD" || type === "LEVEL";

/**
 * The clinic's unresolved tickets linked to a programme: what a publish should offer to
 * resolve. Linked tickets are usually IN_PROGRESS (linking moves OPEN there) but may be OPEN.
 */
export const unresolvedLinkedTo = <
  T extends { programId: string | null; status: ChangeRequestStatus },
>(
  tickets: readonly T[],
  programId: string,
): T[] =>
  tickets.filter(
    (ticket) => ticket.programId === programId && isUnresolved(ticket.status),
  );

/** How many tickets a count may claim: a page that has a next page is "at least" its size. */
export const countLabel = (page: {
  items: readonly unknown[];
  nextCursor: string | null;
}): string => `${page.items.length}${page.nextCursor ? "+" : ""}`;
