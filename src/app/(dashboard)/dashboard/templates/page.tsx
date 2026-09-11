import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/shared/page-kit";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplates } from "@/lib/api-client";
import { getCurrentSession, hasRole } from "@/lib/auth";

export default async function TemplatesPage() {
  const [templates, session] = await Promise.all([getTemplates(), getCurrentSession()]);
  const canEdit = hasRole(session, ["owner", "manager"]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Templates"
        title="Wallet templates"
        description="Design the pass members will save to their phone. Each template is published to every available wallet provider."
        action={canEdit ? { href: "/dashboard/templates/new", label: "New template" } : undefined}
      />

      {templates.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="rounded-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{template.memberCount} members</p>
                  </div>
                  <span className="h-10 w-10 rounded-md border border-border" style={{ backgroundColor: template.backgroundColor }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <WalletStatusBadges statuses={template.walletStatus} />
                <p className="text-sm text-muted-foreground">{template.benefits}</p>
                {canEdit ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/templates/${template.id}`}>Edit template</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState title="No templates yet" message="Create the first wallet template for this clinic." action={canEdit ? { href: "/dashboard/templates/new", label: "Create template" } : undefined} />
      )}
    </div>
  );
}