"use client";

import * as React from "react";
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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {!authEnabled ? <DevRoleSwitcher initialRole={initialRole} /> : null}
    </QueryClientProvider>
  );
}