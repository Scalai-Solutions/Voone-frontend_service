export type Role = "owner" | "manager" | "staff" | "voone_admin";

export const PERMISSIONS = {
  clinicEdit: "clinic:edit",
  membersManage: "members:manage",
  pointsAdjust: "points:adjust",
  scanUse: "scan:use",
  notificationsSend: "notifications:send",
  teamManage: "team:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface VooneSession {
  userId: string;
  role: Role;
  permissions: Permission[];
  clinicId: string;
  /**
   * The clinic's URL key. The backend scopes members by slug rather than id, because the
   * same key is what a QR poster carries — so staff sign-ups and the public page address
   * the clinic identically.
   */
  clinicSlug: string;
  name: string;
  /** The signed-in user's email, when the login supplies one. Recorded as the actor on writes. */
  email?: string;
}

export const DASHBOARD_ROLES: Role[] = ["owner", "manager", "staff"];
export const ALL_ROLES: Role[] = [...DASHBOARD_ROLES, "voone_admin"];

export function hasRole(session: VooneSession | null, allowed: Role[]) {
  return Boolean(session && allowed.includes(session.role));
}

export function hasPermission(
  session: VooneSession | null,
  permission: Permission,
) {
  if (!session) return false;
  if (session.role === "owner" || session.role === "voone_admin") return true;
  if (session.role === "manager") return permission !== PERMISSIONS.teamManage;
  return session.permissions.includes(permission);
}

export function isDashboardRole(role: Role) {
  return DASHBOARD_ROLES.includes(role);
}
