import Link from "next/link";

import { PageHeader } from "@/components/shared/page-kit";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClinic, getTemplates } from "@/lib/api-client";

export default async function ClinicDetailPage({ params }: PageProps<"/admin/clinics/[clinicId]">) {
  const { clinicId } = await params;
  const [clinic, templates] = await Promise.all([getClinic(clinicId), getTemplates()]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tenants" title={clinic.name} description={`${clinic.city} - ${clinic.plan} plan`} action={{ href: "/dashboard/templates", label: "Choose template" }} />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg"><CardHeader><CardTitle className="text-sm text-muted-foreground">Members</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{clinic.members}</p></CardContent></Card>
        <Card className="rounded-lg"><CardHeader><CardTitle className="text-sm text-muted-foreground">Templates</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{clinic.templates}</p></CardContent></Card>
        <Card className="rounded-lg"><CardHeader><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold capitalize">{clinic.status}</p></CardContent></Card>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col gap-3 rounded-md border border-border bg-background/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.memberCount} members</p>
              </div>
              <WalletStatusBadges statuses={template.walletStatus} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/templates/${template.id}`}>Open</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}