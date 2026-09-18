import { ClinicDashboardShell, type ClinicShellNavItem } from "@/components/dashboard/clinic-dashboard-shell";
import { AccessPanel } from "@/components/shared/app-shell";
import { getCurrentSession, hasRole, type Role } from "@/lib/auth";

const navItems: Array<ClinicShellNavItem & { roles: Role[] }> = [
  { href: "/dashboard/templates", label: "Mi centro", icon: "templates", roles: ["owner", "manager"] },
  { href: "/dashboard/members", label: "Miembros", icon: "members", roles: ["owner", "manager", "staff"] },
  { href: "/dashboard", label: "Voone", icon: "overview", roles: ["owner", "manager", "staff"], emblem: true },
  { href: "/dashboard/scan", label: "Escanear", icon: "scan", roles: ["owner", "manager", "staff"] },
  { href: "/dashboard/engage", label: "Comunicaciones", icon: "engage", roles: ["owner", "manager"] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session || !hasRole(session, ["owner", "manager", "staff"])) {
    return <AccessPanel title="Acceso al panel" message="Este espacio es para equipos de clínicas. Cambia el rol en pruebas locales o inicia sesión con una cuenta de clínica." />;
  }

  return (
    <ClinicDashboardShell
      session={session}
      navItems={navItems.filter((item) => hasRole(session, item.roles))}
    >
      {children}
    </ClinicDashboardShell>
  );
}