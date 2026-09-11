import { ClinicDashboardShell, type ClinicShellNavItem } from "@/components/dashboard/clinic-dashboard-shell";
import { AccessPanel } from "@/components/shared/app-shell";
import { getCurrentSession, hasRole, type Role } from "@/lib/auth";

const navItems: Array<ClinicShellNavItem & { roles: Role[] }> = [
  { href: "/dashboard", label: "Overview", icon: "overview", roles: ["owner", "manager", "staff"] },
  { href: "/dashboard/templates", label: "Templates", icon: "templates", roles: ["owner", "manager"] },
  { href: "/dashboard/members", label: "Members", icon: "members", roles: ["owner", "manager", "staff"] },
  { href: "/dashboard/scan", label: "Scan", icon: "scan", roles: ["owner", "manager", "staff"] },
  { href: "/dashboard/engage", label: "Notifications", icon: "engage", roles: ["owner", "manager"] },
  { href: "/dashboard/settings", label: "Settings", icon: "settings", roles: ["owner", "manager"] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session || !hasRole(session, ["owner", "manager", "staff"])) {
    return <AccessPanel title="Dashboard access" message="This workspace is for clinic teams. Switch role in local testing or sign in with a clinic account." />;
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