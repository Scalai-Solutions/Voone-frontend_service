import type { Role } from "@/lib/auth-shared";

export function formatRole(role: Role) {
  if (role === "owner") return "Propietario";
  if (role === "manager") return "Gestor";
  if (role === "staff") return "Equipo";
  return "Administrador Voone";
}