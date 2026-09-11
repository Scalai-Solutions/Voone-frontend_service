import type { Role } from "@/lib/auth";

declare module "next-auth" {
  interface User {
    role: Role;
    clinicId: string;
  }

  interface Session {
    user?: {
      userId: string;
      role: Role;
      clinicId: string;
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
    clinicId?: string;
  }
}