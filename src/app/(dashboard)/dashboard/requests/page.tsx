import { redirect } from "next/navigation";

import { RequestsListClient } from "@/components/dashboard/requests-list-client";
import { getCurrentSession } from "@/lib/auth";
import { changeRequestRole } from "@/lib/change-request-guard";

/** Mis solicitudes: the centre's change requests. Owners and managers only, like the tickets themselves. */
export default async function RequestsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!changeRequestRole(session)) {
    redirect("/dashboard");
  }

  return <RequestsListClient />;
}
