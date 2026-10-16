import { redirect } from "next/navigation";

import { ScanToCredit } from "@/components/dashboard/scan-to-credit";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function ScanPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, PERMISSIONS.scanUse)) {
    redirect("/dashboard");
  }

  return <ScanToCredit />;
}
