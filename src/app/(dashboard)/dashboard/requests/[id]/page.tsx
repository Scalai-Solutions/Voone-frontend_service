import { notFound, redirect } from "next/navigation";

import { RequestDetailClient } from "@/components/dashboard/request-detail-client";
import { getCurrentSession } from "@/lib/auth";
import { changeRequestRole } from "@/lib/change-request-guard";
import { isValidRequestId } from "@/lib/change-requests";

/**
 * One request and its thread. This is the address Voone's emails link to
 * (/dashboard/requests/<id>), so it must open straight from the mail.
 */
export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!changeRequestRole(session)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  if (!isValidRequestId(id)) {
    notFound();
  }

  return <RequestDetailClient id={id} />;
}
