import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-kit";
import { getWalletInfrastructure } from "@/lib/api-client";

function daysUntil(value: string) {
  const remaining = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 86_400_000));
}

export default async function WalletStatusPage() {
  const wallet = await getWalletInfrastructure();
  const expiryDays = daysUntil(wallet.appleCertificateExpiresAt);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Wallet" title="Wallet status" description="Provider readiness and recent wallet API errors." />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Apple Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={wallet.appleEnabled ? "default" : "secondary"}>{wallet.appleEnabled ? "Enabled" : "Coming soon"}</Badge>
            <div className="rounded-lg border border-warning/40 bg-[#fff7e7] p-4">
              <p className="text-sm font-medium">Certificate expiry</p>
              <p className="mt-2 text-3xl font-semibold">{expiryDays} days</p>
              <p className="mt-1 text-sm text-muted-foreground">Expires {new Date(wallet.appleCertificateExpiresAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Google Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={wallet.googlePublishingStatus === "live" ? "default" : "secondary"}>{wallet.googlePublishingStatus === "live" ? "Live" : "Demo access"}</Badge>
            <p className="text-sm text-muted-foreground">Publishing access is read from the wallet status API when configured.</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Recent API errors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wallet.recentErrors.map((item) => (
            <div key={`${item.provider}-${item.label}`} className="flex items-center justify-between rounded-md border border-border bg-background/70 px-4 py-3 text-sm">
              <span>{item.provider === "google" ? "Google Wallet" : "Apple Wallet"} - {item.label}</span>
              <Badge variant={item.count ? "destructive" : "secondary"}>{item.count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}