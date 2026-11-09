import { ApiError } from "@/lib/api-client";
import { parseOwnerFlag, type OwnerFlag } from "@/lib/change-flag";
import type { FlagRequest } from "@/lib/change-request-form";
import type {
  ChangeRequestStatus,
  ChangeRequestType,
  CreateChangeRequestBody,
} from "@/lib/staff-change-requests";

/**
 * The centre's change requests, as the browser calls them: through this app's own
 * /api/staff/change-requests handlers, which take the clinic from the session. The shapes are
 * the backend's owner view (no clinic id, no mail fields, no Voone staff emails).
 */

export interface RequestMessage {
  id: string;
  authorKind: "CLINIC" | "VOONE";
  /** Null on a Voone message: staff emails never reach the centre. */
  authorEmail: string | null;
  body: string;
  createdAt: string;
}

export interface ChangeRequest {
  id: string;
  type: ChangeRequestType;
  targetRef: Record<string, unknown> | null;
  title: string;
  reason: string;
  proposed: Record<string, unknown> | null;
  status: ChangeRequestStatus;
  createdByEmail: string;
  createdByRole: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  /** When a closed request stops being reopenable; null if it is open or the window has passed. */
  reopenableUntil: string | null;
  /** The change was applied the moment it was made (treatments and bonos), with no one at Voone in between. */
  autoApproved?: boolean;
  /** On the answer to making such a change: what the centre should know about it (Spanish). */
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestListItem extends ChangeRequest {
  messageCount: number;
  lastMessageAt: string | null;
}

export interface ChangeRequestDetail extends ChangeRequest {
  messages: RequestMessage[];
}

export interface ChangeRequestPage {
  items: ChangeRequestListItem[];
  nextCursor: string | null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/staff/change-requests${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Change request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

export const listChangeRequests = (query: {
  status?: ChangeRequestStatus;
  cursor?: string | null;
  limit?: number;
}) => {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", String(query.limit));

  const text = params.toString();

  return request<ChangeRequestPage>(text ? `?${text}` : "");
};

export const getChangeRequest = (id: string) =>
  request<ChangeRequestDetail>(`/${encodeURIComponent(id)}`);

export const createChangeRequest = (body: CreateChangeRequestBody) =>
  request<ChangeRequest>("", { method: "POST", body: JSON.stringify(body) });

export const replyToChangeRequest = (id: string, body: string) =>
  request<ChangeRequestDetail>(`/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

export const reopenChangeRequest = (id: string, message?: string) =>
  request<ChangeRequestDetail>(`/${encodeURIComponent(id)}/reopen`, {
    method: "POST",
    body: JSON.stringify(message ? { message } : {}),
  });

/**
 * What the request would do to the plan. The flag is a courtesy: a 429, a 5xx, a network
 * failure, a bad body, an abort and an answer that is not the owner's shape are all
 * `{ status: "none" }` (nothing to show), never an error the form has to handle.
 */
export const previewChangeFlag = async (
  body: FlagRequest,
  signal?: AbortSignal,
): Promise<OwnerFlag> => {
  try {
    const response = await fetch("/api/staff/change-requests/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) return { status: "none" };

    return parseOwnerFlag(await response.json());
  } catch {
    return { status: "none" };
  }
};
