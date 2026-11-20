import Link from "next/link";
import { redirect } from "next/navigation";

import { CommunicationsPageClient } from "@/components/dashboard/communications-page-client";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";

export default async function CommunicationsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  // Said, not hidden: a bounce to the dashboard looks like a broken link. The menu already leaves
  // the entry out for them, so this is reached by a bookmark or a typed address.
  if (!hasPermission(session, PERMISSIONS.notificationsSend)) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-background/70 p-8 text-center">
        <h1 className="text-lg font-semibold">No tienes permiso para Comunicaciones</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu cuenta no puede ver ni enviar notificaciones a los clientes. Pide a la persona
          responsable de tu centro que te dé el permiso de Comunicaciones en Ajustes.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary/70"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <CommunicationsPageClient />;
}
