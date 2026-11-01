/**
 * Who may open and read change requests, and who may no longer edit services directly.
 *
 * Pure so the two rules can be tested without a session or a request. The route handlers apply
 * them after `requireStaffSession`, which has already refused anyone without a clinic.
 */

export type TicketRole = "owner" | "manager";

/**
 * The role to send as `x-actor-role`, or null when the caller may not use tickets.
 *
 * Owners and managers only: a team member who was granted the clinic-edit permission is not
 * one of them (the backend refuses that role too), and Voone admins have no clinic here.
 */
export const changeRequestRole = (
  session: { role: string } | null | undefined,
): TicketRole | null => {
  if (session?.role === "owner") return "owner";
  if (session?.role === "manager") return "manager";

  return null;
};

export const USE_CHANGE_REQUEST = {
  code: "USE_CHANGE_REQUEST",
  message: "Para cambiar los servicios, solicita un cambio a Voone.",
} as const;

/**
 * The refusal for a write to the centre's treatments or bono plans, or null when it may go on.
 *
 * Services change only through a ticket that Voone resolves, so every clinic session is
 * refused, whatever its permissions: a team member granted clinic-edit must not be able to do
 * what the owner cannot. Voone admins are the one exception, for any admin path that reuses
 * these handlers (none does today: `requireStaffSession` turns an admin away before this runs).
 */
export const serviceWriteRefusal = (
  role: string | null | undefined,
): typeof USE_CHANGE_REQUEST | null =>
  role === "voone_admin" ? null : USE_CHANGE_REQUEST;

/**
 * The decision for a service write as data: the session's role in, a ready 403 body out (or
 * null to go on). `requireServiceWriteAllowed` turns it into a Response; tests call it directly.
 */
export const gateServiceWrite = (
  session: { role: string } | null | undefined,
): typeof USE_CHANGE_REQUEST | null => serviceWriteRefusal(session?.role);
