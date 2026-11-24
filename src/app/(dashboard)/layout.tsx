import {
  ClinicDashboardShell,
  type ClinicShellNavItem,
} from "@/components/dashboard/clinic-dashboard-shell";
import { AccessPanel } from "@/components/shared/app-shell";
import { TourProvider } from "@/features/tour/tour-provider";
import {
  PERMISSIONS,
  getCurrentSession,
  hasPermission,
  hasRole,
  type Permission,
  type Role,
} from "@/lib/auth";
import { changeRequestRole } from "@/lib/change-request-guard";
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
  const visibleNavItems = navItems.filter(
    (item) =>
      hasRole(session, item.roles) &&
      (!item.permission || hasPermission(session, item.permission)),
  );

  return (
    // The tutorial lives above the shell so it survives page changes inside the dashboard.
    <TourProvider
      userId={session.userId}
      role={session.role}
      navHrefs={visibleNavItems.map((item) => item.href)}
      // The same rules as the Mi centro page and the settings team section.
      canRequest={hasPermission(session, PERMISSIONS.clinicEdit) && changeRequestRole(session) !== null}
      canManageTeam={hasPermission(session, PERMISSIONS.teamManage)}
    >
      <ClinicDashboardShell
        session={session}
        clinicName={clinic.name}
        navItems={visibleNavItems}
      >
        {children}
      </ClinicDashboardShell>
    </TourProvider>
  );
}
