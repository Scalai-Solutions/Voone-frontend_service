"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, variant = "outline" }: { className?: string; variant?: "outline" | "ghost" | "secondary" }) {
  const router = useRouter();

  function logout() {
    document.cookie = "voone-local-account=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "voone-dev-role=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className={cn("text-destructive hover:bg-destructive/10 hover:text-destructive", className)}
      onClick={logout}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}