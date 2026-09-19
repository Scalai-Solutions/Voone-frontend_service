import { AccessPanel, AppShell, type ShellNavItem } from "@/components/shared/app-shell";
import { getCurrentSession, hasRole } from "@/lib/auth";

const navItems: ShellNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "overview" },
  { href: "/admin/clinics", label: "Clinics", icon: "clinics" },
  { href: "/admin/templates", label: "Template Designs", icon: "templates" },
  { href: "/admin/onboarding", label: "Onboarding", icon: "onboarding" },
  { href: "/admin/wallet", label: "Wallet Integration", icon: "wallet" },
  { href: "/admin/customer-care", label: "Customer Care", icon: "care" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session || !hasRole(session, ["voone_admin"])) {
    return <AccessPanel title="Acceso de administración" message="Esta zona es para soporte interno de Voone. Cambia a administrador de Voone en pruebas locales para verla." />;
  }

  return (
    <AppShell homeHref="/admin" navItems={navItems}>
      {children}
    </AppShell>
  );
}