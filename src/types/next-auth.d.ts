import type { Permission, Role } from "@/lib/auth-shared";

declare module "next-auth" {
  interface User {
    role: Role;
    permissions: Permission[];
    clinicId: string;
    clinicSlug: string;
  }

  interface Session {
    user?: {
      userId: string;
      role: Role;
      permissions: Permission[];
      clinicId: string;
      clinicSlug: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
    permissions?: Permission[];
    clinicId?: string;
    clinicSlug?: string;
  }
}
