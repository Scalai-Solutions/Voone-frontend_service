import { adminRequest, jsonBody } from "@/lib/admin-request";
import type {
  CreateTreatmentInput,
  ManagedTreatment,
  TreatmentCatalogue,
  TreatmentCategory,
  UpdateTreatmentInput,
} from "@/lib/api-client";
import type {
  BonoPlanRow,
  CreateBonoPlanInput,
  UpdateBonoPlanInput,
} from "@/lib/bono-api";

/**
 * The admin services editor's calls: a clinic's treatments and bono plans, through
 * `/api/admin/clinics/:clinicId/...`.
 */

const base = (clinicId: string) =>
  `/api/admin/clinics/${encodeURIComponent(clinicId)}`;

export const getClinicTreatments = (clinicId: string) =>
  adminRequest<TreatmentCatalogue>(`${base(clinicId)}/treatments`);

export const getClinicTreatmentCategories = (clinicId: string) =>
  adminRequest<TreatmentCategory[]>(`${base(clinicId)}/treatments/categories`);

export const createClinicTreatment = (
  clinicId: string,
  input: CreateTreatmentInput,
) =>
  adminRequest<ManagedTreatment>(`${base(clinicId)}/treatments`, {
    method: "POST",
    ...jsonBody(input),
  });

export const updateClinicTreatment = (
  clinicId: string,
  id: string,
  input: UpdateTreatmentInput,
) =>
  adminRequest<ManagedTreatment>(
    `${base(clinicId)}/treatments/${encodeURIComponent(id)}`,
    { method: "PATCH", ...jsonBody(input) },
  );

export const deleteClinicTreatment = (clinicId: string, id: string) =>
  adminRequest<{ status: "deleted" }>(
    `${base(clinicId)}/treatments/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

export const getClinicBonoPlans = (clinicId: string) =>
  adminRequest<{ plans: BonoPlanRow[] }>(`${base(clinicId)}/bonos`).then(
    (r) => r.plans,
  );

export const createClinicBonoPlan = (
  clinicId: string,
  input: CreateBonoPlanInput,
) =>
  adminRequest<BonoPlanRow>(`${base(clinicId)}/bonos`, {
    method: "POST",
    ...jsonBody(input),
  });

export const updateClinicBonoPlan = (
  clinicId: string,
  id: string,
  patch: UpdateBonoPlanInput,
) =>
  adminRequest<BonoPlanRow>(
    `${base(clinicId)}/bonos/${encodeURIComponent(id)}`,
    { method: "PATCH", ...jsonBody(patch) },
  );

export const deleteClinicBonoPlan = (clinicId: string, id: string) =>
  adminRequest<{ status: "deleted" | "retired" }>(
    `${base(clinicId)}/bonos/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
