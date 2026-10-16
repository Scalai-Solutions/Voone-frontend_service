import { redirect } from "next/navigation";

import { CommunicationsPageClient } from "@/components/dashboard/communications-page-client";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function CommunicationsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, PERMISSIONS.notificationsSend)) {
    redirect("/dashboard");
  }

  return <CommunicationsPageClient />;
}
