import "server-only";

import { getCurrentSession, isDashboardRole, type VooneSession } from "@/lib/auth";

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
      response: Response.json({ code: "FORBIDDEN", message: "Forbidden" }, { status: 403 }),
    };
  }

  if (!session.clinicSlug || !session.clinicId) {
    // A session without a clinic cannot be scoped, and guessing one would be worse than
    // refusing. Distinct from the 403 so a misconfigured session is diagnosable.
    return {
      response: Response.json(
        { code: "NO_CLINIC", message: "La sesión no tiene una clínica asociada." },
        { status: 409 }
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
export const requireAdminSession = async (): Promise<
  { session: VooneSession } | { response: Response }
> => {
  const session = await getCurrentSession();

  if (!session || session.role !== "voone_admin") {
    return {
      response: Response.json({ code: "FORBIDDEN", message: "Forbidden" }, { status: 403 })
    };
  }

  return { session };
};
