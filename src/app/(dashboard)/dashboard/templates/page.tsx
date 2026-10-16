import { redirect } from "next/navigation";

import { CenterView } from "@/components/dashboard/center-view";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function TemplatesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const canEdit = hasPermission(session, PERMISSIONS.clinicEdit);

  return <CenterView canEdit={canEdit} />;
}
