import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/shared/page-kit";
import { getPlatformOverview } from "@/lib/api-client";

function daysUntil(value: string) {
  const remaining = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 86_400_000));
}

export default async function AdminOverviewPage() {
  const overview = await getPlatformOverview();
  const expiryDays = daysUntil(overview.wallet.appleCertificateExpiresAt);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title="Admin overview" description="Tenant growth and wallet operations in one place." />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Clinics" value={overview.totalClinics.toLocaleString()} detail="Live and onboarding tenants" />
        <StatCard label="Members" value={overview.totalMembers.toLocaleString()} detail="Across all clinics" />
        <StatCard label="Apple certificate" value={`${expiryDays} days`} detail="Renew before expiry to avoid pass updates failing" />
      </section>

      <Card className="rounded-lg border-warning/40 bg-[#fff7e7]">
        <CardHeader>
          <CardTitle className="text-lg">Wallet infrastructure</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium">Apple Wallet</p>
            <p className="mt-1 text-sm text-muted-foreground">{overview.wallet.appleEnabled ? "Enabled" : "Coming soon"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Google Wallet</p>
            <p className="mt-1 text-sm text-muted-foreground capitalize">{overview.wallet.googlePublishingStatus}</p>
          </div>
          <div className="flex items-end md:justify-end">
            <Button asChild variant="outline">
              <Link href="/admin/wallet">Open wallet status</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}