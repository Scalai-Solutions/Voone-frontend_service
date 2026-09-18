import { timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { getServerSession, type NextAuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type Role = "owner" | "manager" | "staff" | "voone_admin";

export interface VooneSession {
  userId: string;
  role: Role;
  clinicId: string;
  /**
   * The clinic's URL key. The backend scopes members by slug rather than id, because the
   * same key is what a QR poster carries — so staff sign-ups and the public page address
   * the clinic identically.
   */
  clinicSlug: string;
  name: string;
}

const DASHBOARD_ROLES: Role[] = ["owner", "manager", "staff"];
const ALL_ROLES: Role[] = [...DASHBOARD_ROLES, "voone_admin"];

export function isAuthEnabled() {
  return process.env.AUTH_ENABLED === "true";
}

export function hasRole(session: VooneSession | null, allowed: Role[]) {
  return Boolean(session && allowed.includes(session.role));
}

export function isDashboardRole(role: Role) {
  return DASHBOARD_ROLES.includes(role);
}

function parseRole(value: string | undefined): Role {
  return value && ALL_ROLES.includes(value as Role) ? (value as Role) : "owner";
}

function roleForLocalAccount(value: string | undefined): Role | undefined {
  if (value === "client.voone.ai") return "owner";
  if (value === "admin.voone.ai") return "voone_admin";
  return undefined;
}

export async function getMockSession(): Promise<VooneSession> {
  const cookieStore = await cookies();
  const localAccount = cookieStore.get("voone-local-account")?.value;
  const role = roleForLocalAccount(localAccount) ?? parseRole(cookieStore.get("voone-dev-role")?.value);

  return {
    userId: localAccount ?? "dev-user-001",
    role,
    // Both match the backend seed, so a dashboard running against a freshly seeded
    // backend can add members, write its template and render its QR with no configuration.
    // The id has to be the real one: template writes are scoped by clinic id, and a
    // placeholder here meant every one of them failed — silently, while the API client
    // still fell back to mock data on error.
    clinicId: "00000000-0000-4000-8000-0000000a0001",
    clinicSlug: "aurea",
    name: role === "voone_admin" ? "Administrador Voone" : "Equipo Clínica Aurea",
  };
}

export async function getCurrentSession(): Promise<VooneSession | null> {
  if (!isAuthEnabled()) {
    return getMockSession();
  }

  const session = await getServerSession(authOptions);
  const user = session?.user;

  // A clinic is deliberately NOT required. Voone staff belong to no clinic, so demanding
  // one here made every voone_admin session resolve to null — the admin area rendered its
  // access-denied panel and the provisioning endpoint answered 403 to a valid
  // administrator. Whether a clinic is needed depends on the operation, so that check
  // belongs with the operation: requireStaffSession refuses a clinic-less session, while
  // requireAdminSession does not care.
  if (!user?.role || !user.userId) {
    return null;
  }

  return {
    userId: user.userId,
    role: user.role,
    clinicId: user.clinicId,
    clinicSlug: user.clinicSlug ?? "",
    name: user.name ?? "Voone user",
  };
}

/**
 * Constant-time comparison, so a wrong password cannot be narrowed by timing. Lengths are
 * compared first because timingSafeEqual throws on a mismatch, and a length is not secret.
 */
const secretsMatch = (received: string, expected: string): boolean => {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * The accounts the credentials provider accepts, from environment variables.
 *
 * Two of them, because one cannot be both: the clinic dashboard requires an owner, manager
 * or staff role, and the admin area requires voone_admin — isDashboardRole excludes it. A
 * single account therefore locked one of the two areas out whichever role it was given.
 *
 * Not per-user authentication: the User model has no password column, so real accounts
 * need a schema change. This is two shared operator logins, and what it fixes is that the
 * browser no longer grants itself a role.
 */
const normalizeLoginIdentifier = (value: string) => {
  const trimmedValue = value.trim().toLowerCase();

  return trimmedValue.includes("@") ? trimmedValue : trimmedValue.replace(/[\s()-]/g, "");
};

const configuredAccounts = () => {
  const accounts: Array<{ identifiers: string[]; password: string; user: User }> = [];

  const clinicEmail = process.env.VOONE_DEV_AUTH_EMAIL;
  const clinicPassword = process.env.VOONE_DEV_AUTH_PASSWORD;

  if (clinicEmail && clinicPassword) {
    const clinicIdentifiers = [clinicEmail, process.env.VOONE_DEV_AUTH_PHONE]
      .filter((value): value is string => Boolean(value))
      .map(normalizeLoginIdentifier);

    accounts.push({
      identifiers: clinicIdentifiers,
      password: clinicPassword,
      user: {
        id: "configured-user",
        name: "Usuario Voone",
        email: clinicEmail,
        role: parseRole(process.env.VOONE_DEV_AUTH_ROLE),
        clinicId: process.env.VOONE_DEV_AUTH_CLINIC_ID ?? "clinic-aurea",
        clinicSlug: process.env.VOONE_DEV_AUTH_CLINIC_SLUG ?? "aurea"
      }
    });
  }

  const adminEmail = process.env.VOONE_ADMIN_AUTH_EMAIL;
  const adminPassword = process.env.VOONE_ADMIN_AUTH_PASSWORD;

  if (adminEmail && adminPassword) {
    const adminIdentifiers = [adminEmail, process.env.VOONE_ADMIN_AUTH_PHONE]
      .filter((value): value is string => Boolean(value))
      .map(normalizeLoginIdentifier);

    accounts.push({
      identifiers: adminIdentifiers,
      password: adminPassword,
      user: {
        id: "configured-admin",
        name: "Administrador Voone",
        email: adminEmail,
        role: "voone_admin" as Role,
        // Deliberately empty: Voone staff belong to no clinic. requireStaffSession refuses
        // a session without one, so an administrator cannot perform a clinic's own writes
        // by accident — which is the correct separation rather than a missing feature.
        clinicId: "",
        clinicSlug: ""
      }
    });
  }

  return accounts;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Voone credentials",
      credentials: {
        identifier: { label: "Email o teléfono", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        const identifier = normalizeLoginIdentifier(credentials.identifier);

        const account = configuredAccounts().find(
          (candidate) =>
            candidate.identifiers.includes(identifier) &&
            secretsMatch(credentials.password, candidate.password)
        );

        return account ? account.user : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.clinicSlug = user.clinicSlug;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.userId = String(token.userId ?? "");
        session.user.role = parseRole(typeof token.role === "string" ? token.role : undefined);
        session.user.clinicId = String(token.clinicId ?? "");
        session.user.clinicSlug = String(token.clinicSlug ?? "");
      }

      return session;
    },
  },
};