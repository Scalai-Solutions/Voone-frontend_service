import {
  adminApiFetch,
  readCappedText,
  rejectBadIds,
  resolveClinicSlug,
} from "@/lib/admin-api-proxy";
import { isForwardableClinicStaffPath } from "@/lib/admin-clinic-staff-paths";
import { forwardResponse } from "@/lib/staff-api";
import { requireAdminSession } from "@/lib/staff-guard";

type Context = { params: Promise<{ clinicId: string; path: string[] }> };

const notFound = () =>
  Response.json({ code: "NOT_FOUND", message: "Not found" }, { status: 404 });

/**
 * A clinic's members, for Voone administrators: the same calls the clinic dashboard makes
 * through /api/staff (list, profile, points, visits, rewards, bonos, audiences), for the clinic
 * named in the URL instead of the one in the session.
 *
 * The backend's clinic routes are keyed by slug and trust the staff key, so the clinic is looked
 * up from the id here, after the admin session is checked. The path is allowlisted (see
 * admin-clinic-staff-paths.ts) so that "any clinic" never becomes "any backend route".
 */
const forward = async (request: Request, context: Context) => {
  const guard = await requireAdminSession();

  if ("response" in guard) return guard.response;

  const { clinicId, path } = await context.params;
  const badId = rejectBadIds(clinicId, ...path);

  // 404 rather than 403: the answer does not confirm that a backend route exists there.
  if (badId || !isForwardableClinicStaffPath(path, request.method)) return notFound();

  let body: string | undefined;

  if (request.method !== "GET" && request.method !== "DELETE") {
    const read = await readCappedText(request);

    if ("response" in read) return read.response;

    body = read.text || undefined;
  }

  const search = new URL(request.url).search;

  // Audiences are keyed by clinic id and check the caller's role; VOONE_ADMIN may act on any
  // clinic. Only this clinic's audiences, whatever id the browser put in the path.
  if (path[0] === "clinics") {
    if (path[1] !== clinicId) return notFound();

    return forwardResponse(
      await adminApiFetch(`/v1/${path.map(encodeURIComponent).join("/")}${search}`, {
        method: request.method,
        body,
        headers: {
          "x-voone-role": "VOONE_ADMIN",
          "x-voone-user-id": guard.session.userId,
          "x-voone-clinic-id": clinicId,
        },
      }),
    );
  }

  const clinic = await resolveClinicSlug(clinicId);

  if ("response" in clinic) return clinic.response;

  const clinicBase = `/v1/clinics/${encodeURIComponent(clinic.slug)}`;
  const response = await adminApiFetch(
    `${clinicBase}/${path.map(encodeURIComponent).join("/")}${search}`,
    { method: request.method, body },
  );

  // Manual points: the backend's clinic route checks the member is this clinic's and answers a
  // summary; the profile reads the directory's member shape, so answer that, as the staff
  // route does.
  if (path[2] === "points" && response.ok) {
    return forwardResponse(
      await adminApiFetch(`${clinicBase}/members/${encodeURIComponent(path[1])}`, {
        method: "GET",
      }),
    );
  }

  return forwardResponse(response);
};

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
