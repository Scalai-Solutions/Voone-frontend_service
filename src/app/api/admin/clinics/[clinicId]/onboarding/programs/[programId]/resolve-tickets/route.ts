import {
  forwardValidatedWrite,
  rejectBadIds,
} from "@/lib/admin-api-proxy";
import { parseResolveTicketsBody } from "@/lib/change-request-parsers";
import { requireAdminSession } from "@/lib/staff-guard";

/**
 * After a programme is published: resolves every open ticket linked to it, with the given note.
 *
 * A dedicated route rather than an entry in the onboarding catch-all's allowlist, because it
 * needs two things the catch-all does not do: the `voone_admin` role header the backend
 * demands, and a body whitelisted to `{ note }`. Next serves this static path before the
 * catch-all, so the catch-all never sees it.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ clinicId: string; programId: string }> },
) {
  const guard = await requireAdminSession();

  if ("response" in guard) {
    return guard.response;
  }

  const { clinicId, programId } = await context.params;

  const badId = rejectBadIds(clinicId, programId);

  if (badId) {
    return badId;
  }

  return forwardValidatedWrite(
    request,
    `/v1/admin/clinics/${encodeURIComponent(clinicId)}/onboarding/programs/${encodeURIComponent(programId)}/resolve-tickets`,
    "POST",
    parseResolveTicketsBody,
  );
}
