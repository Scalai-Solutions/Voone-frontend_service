import {
  ClinicDashboardShell,
  type ClinicShellNavItem,
} from "@/components/dashboard/clinic-dashboard-shell";
import { AccessPanel } from "@/components/shared/app-shell";
import {
  PERMISSIONS,
  getCurrentSession,
  hasPermission,
  hasRole,
  type Permission,
  type Role,
} from "@/lib/auth";
import { getCurrentStaffClinic } from "@/lib/current-clinic";

const navItems: Array<
  ClinicShellNavItem & { roles: Role[]; permission?: Permission }
> = [
  {
    href: "/dashboard/templates",
    label: "Mi centro",
    icon: "templates",
    roles: ["owner", "manager", "staff"],
    permission: PERMISSIONS.clinicEdit,
  },
  {
    href: "/dashboard/members",
    label: "Miembros",
    icon: "members",
    roles: ["owner", "manager", "staff"],
    permission: PERMISSIONS.membersManage,
  },
  {
    href: "/dashboard",
    label: "Voone",
    icon: "overview",
    roles: ["owner", "manager", "staff"],
    emblem: true,
  },
  {
    href: "/dashboard/scan",
    label: "Escanear",
    icon: "scan",
    roles: ["owner", "manager", "staff"],
    permission: PERMISSIONS.scanUse,
  },
  {
    href: "/dashboard/engage",
    label: "Comunicaciones",
    icon: "engage",
    roles: ["owner", "manager", "staff"],
    permission: PERMISSIONS.notificationsSend,
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session || !hasRole(session, ["owner", "manager", "staff"])) {
    return (
      <AccessPanel
        title="Acceso al panel"
        message="Este espacio es para equipos de clínicas. Cambia el rol en pruebas locales o inicia sesión con una cuenta de clínica."
      />
    );
  }

  const clinic = await getCurrentStaffClinic();

  return (
    <ClinicDashboardShell
      session={session}
      clinicName={clinic.name}
      navItems={navItems.filter(
        (item) =>
          hasRole(session, item.roles) &&
          (!item.permission || hasPermission(session, item.permission)),
      )}
    >
      {children}
    </ClinicDashboardShell>
  );
}
