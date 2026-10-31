import { ApiError } from "@/lib/api-client";
import type {
  ChangeRequestStatus,
  ChangeRequestType,
  CreateChangeRequestBody,
} from "@/lib/change-requests";

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
