import { AccessPanel, AppShell, type ShellNavItem } from "@/components/shared/app-shell";
import { getCurrentSession, hasRole } from "@/lib/auth";

const navItems: ShellNavItem[] = [
  { href: "/admin", label: "Inicio", icon: "overview" },
  { href: "/admin/clinics", label: "Clínicas", icon: "clinics" },
  { href: "/admin/members", label: "Buscar miembros", icon: "search" },
  { href: "/admin/wallet", label: "Estado Wallet", icon: "wallet" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session || !hasRole(session, ["voone_admin"])) {
    return <AccessPanel title="Acceso de administración" message="Esta zona es para soporte interno de Voone. Cambia a administrador de Voone en pruebas locales para verla." />;
  }

  return (
    <AppShell area="Administración Voone" homeHref="/admin" session={session} navItems={navItems}>
      {children}
    </AppShell>
  );
}