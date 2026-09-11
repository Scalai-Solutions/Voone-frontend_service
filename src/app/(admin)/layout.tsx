import { AccessPanel, AppShell, type ShellNavItem } from "@/components/shared/app-shell";
import { getCurrentSession, hasRole } from "@/lib/auth";

const navItems: ShellNavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/clinics", label: "Clinics", icon: "clinics" },
  { href: "/admin/members", label: "Member search", icon: "search" },
  { href: "/admin/wallet", label: "Wallet status", icon: "wallet" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session || !hasRole(session, ["voone_admin"])) {
    return <AccessPanel title="Admin access" message="This area is for Voone internal support. Switch to voone admin in local testing to preview it." />;
  }

  return (
    <AppShell area="Voone Admin" homeHref="/admin" session={session} navItems={navItems}>
      {children}
    </AppShell>
  );
}