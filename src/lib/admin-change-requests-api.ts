import { adminRequest, jsonBody } from "@/lib/admin-request";
import {
  listSearch,
  type ApplyResult,
  type ChangeRequestDetail,
  type ChangeRequestPage,
  type ChangeRequestStatus,
  type DraftResult,
  type ListParams,
} from "@/lib/admin-change-requests";

/** The admin ticket calls, through this app's `/api/admin/change-requests` route handlers. */

export const listChangeRequests = (params: ListParams) =>
  adminRequest<ChangeRequestPage>(`/api/admin/change-requests${listSearch(params)}`);

export const listClinicChangeRequests = (
  clinicId: string,
  params: Omit<ListParams, "clinicId">,
) =>
  adminRequest<ChangeRequestPage>(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}/change-requests${listSearch(params)}`,
  );

const one = (id: string) => `/api/admin/change-requests/${encodeURIComponent(id)}`;

export const getChangeRequest = (id: string) =>
  adminRequest<ChangeRequestDetail>(one(id));

export const setChangeRequestStatus = (
  id: string,
  input: { status: ChangeRequestStatus; resolutionNote?: string },
) =>
  adminRequest<ChangeRequestDetail>(`${one(id)}/status`, {
    method: "PATCH",
    ...jsonBody(input),
  });

export const replyToChangeRequest = (id: string, body: string) =>
  adminRequest<ChangeRequestDetail>(`${one(id)}/messages`, {
    method: "POST",
    ...jsonBody({ body }),
  });

export const applyChangeRequest = (
  id: string,
  input: { note?: string; categoryId?: string } = {},
) =>
  adminRequest<ApplyResult>(`${one(id)}/apply`, {
    method: "POST",
    ...jsonBody({
      ...(input.note ? { note: input.note } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    }),
  });

export const createChangeRequestDraft = (id: string) =>
  adminRequest<DraftResult>(`${one(id)}/draft`, {
    method: "POST",
    ...jsonBody({}),
  });

export const resolveLinkedTickets = (
  clinicId: string,
  programId: string,
  note: string,
) =>
  adminRequest<{ resolved: string[] }>(
    `/api/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/programs/${encodeURIComponent(programId)}/resolve-tickets`,
    { method: "POST", ...jsonBody({ note }) },
  );
