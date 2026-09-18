import { redirect } from "next/navigation";

import { CenterView } from "@/components/dashboard/center-view";
import { getTreatments } from "@/lib/api-client";
import { getCurrentSession, hasRole } from "@/lib/auth";

export default async function TemplatesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const canEdit = hasRole(session, ["owner", "manager"]);
  const treatments = await getTreatments();

  return <CenterView treatments={treatments} canEdit={canEdit} />;
}