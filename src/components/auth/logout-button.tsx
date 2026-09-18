"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, variant = "outline", showLabel = false }: { className?: string; variant?: "outline" | "ghost" | "secondary"; showLabel?: boolean }) {
  const router = useRouter();

  async function logout() {
    // Only clearing the dev cookies left a real next-auth session intact, so "log out"
    // navigated to /login while the visitor stayed signed in. signOut ends the session;
    // the cookies are still cleared because they are what the mock session reads when
    // authentication is disabled.
    document.cookie = "voone-local-account=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "voone-dev-role=; path=/; max-age=0; SameSite=Lax";

    await signOut({ redirect: false });

    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={showLabel ? "default" : "icon"}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className={cn("text-destructive hover:bg-destructive/10 hover:text-destructive", className)}
      onClick={logout}
    >
      <LogOut className="h-4 w-4" />
      {showLabel ? <span>Cerrar sesión</span> : null}
    </Button>
  );
}