"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DevRoleSwitcher } from "@/components/shared/dev-role-switcher";
import type { Role } from "@/lib/auth";

export function AppProviders({
  authEnabled,
  initialRole,
  children,
}: {
  authEnabled: boolean;
  initialRole: Role;
  children: React.ReactNode;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  // The switcher is a staff-facing development aid. /alta/* is the public page a client
  // scans at reception, and a role picker floating over it is both confusing and a hint
  // that there is an admin surface to go looking for.
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith("/alta") ?? false;

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {!authEnabled && !isPublicRoute ? <DevRoleSwitcher initialRole={initialRole} /> : null}
    </QueryClientProvider>
  );
}