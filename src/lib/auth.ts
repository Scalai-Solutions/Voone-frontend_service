import { cookies } from "next/headers";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type Role = "owner" | "manager" | "staff" | "voone_admin";

export interface VooneSession {
  userId: string;
  role: Role;
  clinicId: string;
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
    clinicId: "clinic-aurea",
    name: role === "voone_admin" ? "Voone Admin" : "Aurea Clinic Team",
  };
}

export async function getCurrentSession(): Promise<VooneSession | null> {
  if (!isAuthEnabled()) {
    return getMockSession();
  }

  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.role || !user.clinicId || !user.userId) {
    return null;
  }

  return {
    userId: user.userId,
    role: user.role,
    clinicId: user.clinicId,
    name: user.name ?? "Voone user",
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Voone credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const configuredEmail = process.env.VOONE_DEV_AUTH_EMAIL;
        const configuredPassword = process.env.VOONE_DEV_AUTH_PASSWORD;

        if (!configuredEmail || !configuredPassword) {
          return null;
        }

        if (credentials?.email !== configuredEmail || credentials.password !== configuredPassword) {
          return null;
        }

        return {
          id: "configured-user",
          name: "Voone user",
          email: configuredEmail,
          role: parseRole(process.env.VOONE_DEV_AUTH_ROLE),
          clinicId: process.env.VOONE_DEV_AUTH_CLINIC_ID ?? "clinic-aurea",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.clinicId = user.clinicId;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.userId = String(token.userId ?? "");
        session.user.role = parseRole(typeof token.role === "string" ? token.role : undefined);
        session.user.clinicId = String(token.clinicId ?? "");
      }

      return session;
    },
  },
};