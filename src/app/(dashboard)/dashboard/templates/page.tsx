import { redirect } from "next/navigation";

import { CenterView } from "@/components/dashboard/center-view";
import { getCurrentSession, hasRole } from "@/lib/auth";

export default async function TemplatesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const canEdit = hasRole(session, ["owner", "manager"]);

  return <CenterView canEdit={canEdit} />;
}