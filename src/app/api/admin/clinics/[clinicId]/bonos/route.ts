import {
  adminApiFetch,
  forwardValidatedWrite,
  rejectBadIds,
} from "@/lib/admin-api-proxy";
import { parseBonoCreate } from "@/lib/admin-catalogue-parsers";
import { forwardResponse } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ clinicId: string }> };

/**
 * A clinic's session-voucher (bono) plans for the admin services editor: list and add.
 *
 * Unlike treatments, the backend already has admin routes keyed by clinic id for these
 * (`/admin/clinics/:clinicId/onboarding/bonos`, the ones the onboarding flow uses, same
 * service and validation as the centre's slug route), so no slug lookup is needed.
 */
export async function GET(_request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;

  const badId = rejectBadIds(clinicId);

  if (badId) {
    return badId;
  }

  return forwardResponse(
    await adminApiFetch(
      `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/bonos`,
      { method: "GET" },
    ),
  );
}

export async function POST(request: Request, context: Context) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId } = await context.params;

  const badId = rejectBadIds(clinicId);

  if (badId) {
    return badId;
  }

  return forwardValidatedWrite(
    request,
    `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/bonos`,
    "POST",
    parseBonoCreate,
  );
}
