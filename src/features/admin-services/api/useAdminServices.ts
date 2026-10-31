import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClinicBonoPlan,
  createClinicTreatment,
  deleteClinicBonoPlan,
  deleteClinicTreatment,
  getClinicBonoPlans,
  getClinicTreatmentCategories,
  getClinicTreatments,
  updateClinicBonoPlan,
  updateClinicTreatment,
} from "@/lib/admin-services-api";
import type {
  CreateTreatmentInput,
  UpdateTreatmentInput,
} from "@/lib/api-client";
import type {
  CreateBonoPlanInput,
  UpdateBonoPlanInput,
} from "@/lib/bono-api";

/** Keys local to this feature, so the shared query-keys file stays untouched. */
export const adminServicesKeys = {
  treatments: (clinicId: string) =>
    ["admin-services", clinicId, "treatments"] as const,
  categories: (clinicId: string) =>
    ["admin-services", clinicId, "categories"] as const,
  bonos: (clinicId: string) => ["admin-services", clinicId, "bonos"] as const,
};

export const useClinicTreatments = (clinicId: string) =>
  useQuery({
    queryKey: adminServicesKeys.treatments(clinicId),
    queryFn: () => getClinicTreatments(clinicId),
  });

export const useClinicTreatmentCategories = (
  clinicId: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: adminServicesKeys.categories(clinicId),
    queryFn: () => getClinicTreatmentCategories(clinicId),
    enabled,
    staleTime: 5 * 60_000,
  });

/** Refreshes after a write, and after a failed one: a 404 means the list is stale. */
function useRefresh(key: readonly unknown[]) {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: key });
}

export function useCreateClinicTreatment(clinicId: string) {
  const refresh = useRefresh(adminServicesKeys.treatments(clinicId));

  return useMutation({
    mutationFn: (input: CreateTreatmentInput) =>
      createClinicTreatment(clinicId, input),
    onSuccess: () => refresh(),
  });
}

export function useUpdateClinicTreatment(clinicId: string) {
  const refresh = useRefresh(adminServicesKeys.treatments(clinicId));

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTreatmentInput }) =>
      updateClinicTreatment(clinicId, id, input),
    onSuccess: () => refresh(),
    onError: () => refresh(),
  });
}

export function useDeleteClinicTreatment(clinicId: string) {
  const refresh = useRefresh(adminServicesKeys.treatments(clinicId));

  return useMutation({
    mutationFn: (id: string) => deleteClinicTreatment(clinicId, id),
    onSuccess: () => refresh(),
    onError: () => refresh(),
  });
}

export const useClinicBonoPlans = (clinicId: string) =>
  useQuery({
    queryKey: adminServicesKeys.bonos(clinicId),
    queryFn: () => getClinicBonoPlans(clinicId),
  });

export function useCreateClinicBonoPlan(clinicId: string) {
  const refresh = useRefresh(adminServicesKeys.bonos(clinicId));

  return useMutation({
    mutationFn: (input: CreateBonoPlanInput) =>
      createClinicBonoPlan(clinicId, input),
    onSuccess: () => refresh(),
  });
}

export function useUpdateClinicBonoPlan(clinicId: string) {
  const refresh = useRefresh(adminServicesKeys.bonos(clinicId));

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBonoPlanInput }) =>
      updateClinicBonoPlan(clinicId, id, patch),
    onSuccess: () => refresh(),
    onError: () => refresh(),
  });
}

export function useDeleteClinicBonoPlan(clinicId: string) {
  const refresh = useRefresh(adminServicesKeys.bonos(clinicId));

  return useMutation({
    mutationFn: (id: string) => deleteClinicBonoPlan(clinicId, id),
    onSuccess: () => refresh(),
    onError: () => refresh(),
  });
}
