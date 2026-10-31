import "server-only";

import {
  changeRequestRole,
  serviceWriteRefusal,
  type TicketRole,
} from "@/lib/change-request-guard";
import {
  PERMISSIONS,
  getCurrentSession,
  hasPermission,
  isDashboardRole,
  type Permission,
  type VooneSession,
} from "@/lib/auth";

/**
 * The session behind a staff route handler, or a Response to return instead.
 *
 * Every staff handler resolves the clinic from this rather than from the request body, so
 * a signed-in member of one clinic cannot act on another by changing a payload. That is
 * the actual protection here; the shared key only proves the call came from this app.
 */
export const requireStaffSession = async (): Promise<
  { session: VooneSession } | { response: Response }
> => {
  const session = await getCurrentSession();

  if (!session || !isDashboardRole(session.role)) {
    return {
      response: Response.json(
        { code: "FORBIDDEN", message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  if (!session.clinicSlug || !session.clinicId) {
    // A session without a clinic cannot be scoped, and guessing one would be worse than
    // refusing. Distinct from the 403 so a misconfigured session is diagnosable.
    return {
      response: Response.json(
        {
          code: "NO_CLINIC",
          message: "La sesión no tiene una clínica asociada.",
        },
        { status: 409 },
      ),
    };
  }

  return { session };
};

/**
 * The session behind an admin route handler, or a Response to return instead.
 *
 * Separate from requireStaffSession because these are different things: a clinic's staff
 * act on their own clinic, while Voone staff act across all of them. The admin account
 * deliberately has no clinic, so requireStaffSession refuses it — an administrator cannot
 * perform a clinic's own writes by accident.
 */
export const requirePermission = async (
  permission: Permission,
): Promise<{ session: VooneSession } | { response: Response }> => {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard;
  }

  if (!hasPermission(guard.session, permission)) {
    return {
      response: Response.json(
        { code: "FORBIDDEN", message: "Permiso insuficiente." },
        { status: 403 },
      ),
    };
  }

  return guard;
};

export const requireAdminSession = async (): Promise<
  { session: VooneSession } | { response: Response }
> => {
  const session = await getCurrentSession();

  if (!session || session.role !== "voone_admin") {
    return {
      response: Response.json(
        { code: "FORBIDDEN", message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { session };
};

/**
 * The session behind a change-request route handler, with the role to send to the backend.
 *
 * Clinic-edit permission AND the owner or manager role: a team member granted clinic-edit
 * passes the permission check but is not one of the roles the backend accepts for tickets,
 * and Voone admins are already turned away by `requireStaffSession`.
 */
export const requireChangeRequestSession = async (): Promise<
  { session: VooneSession; role: TicketRole } | { response: Response }
> => {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard;
  }

  const role = changeRequestRole(guard.session);

  if (!role) {
    return {
      response: Response.json(
        {
          code: "FORBIDDEN",
          message: "Solo el propietario o un gestor pueden solicitar cambios.",
        },
        { status: 403 },
      ),
    };
  }

  return { session: guard.session, role };
};

/**
 * The guard for a write to the centre's treatments or bono plans.
 *
 * Services change only through a change request that Voone resolves, so the clinic's own
 * write routes answer 403 USE_CHANGE_REQUEST to every clinic session, whatever its permission
 * (see `serviceWriteRefusal`). Reads, the visit screens and the member-level bono flows
 * (cancel, consumption) are untouched. Runs before the body is read, so a refused write
 * costs nothing.
 */
export const requireServiceWriteAllowed = async (): Promise<
  { session: VooneSession } | { response: Response }
> => {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard;
  }

  const refusal = serviceWriteRefusal(guard.session.role);

  if (refusal) {
    return { response: Response.json(refusal, { status: 403 }) };
  }

  return guard;
};
