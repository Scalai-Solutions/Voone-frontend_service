import { redirect } from "next/navigation";

import { MembersTable } from "@/components/dashboard/members-table";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function MembersPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, PERMISSIONS.membersManage)) {
    redirect("/dashboard");
  }

  return (
    <div>
      <MembersTable />
    </div>
  );
}
