import { redirect } from "next/navigation";

import { CenterView } from "@/components/dashboard/center-view";
import { changeRequestRole } from "@/lib/change-request-guard";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function TemplatesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const canEdit = hasPermission(session, PERMISSIONS.clinicEdit);

  // Tickets are for owners and managers only; a team member granted clinic-edit may look but not ask.
  const canRequest = canEdit && changeRequestRole(session) !== null;

  return <CenterView canEdit={canEdit} canRequest={canRequest} />;
}
