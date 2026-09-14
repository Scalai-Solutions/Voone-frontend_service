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
      <PageHeader eyebrow="Wallet" title="Estado Wallet" description="Disponibilidad de proveedores y errores recientes de la API Wallet." />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Apple Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={wallet.appleEnabled ? "default" : "secondary"}>{wallet.appleEnabled ? "Activo" : "Próximamente"}</Badge>
            <div className="rounded-lg border border-warning/40 bg-[#fff7e7] p-4">
              <p className="text-sm font-medium">Vencimiento del certificado</p>
              <p className="mt-2 text-3xl font-semibold">{expiryDays} días</p>
              <p className="mt-1 text-sm text-muted-foreground">Vence el {new Date(wallet.appleCertificateExpiresAt).toLocaleDateString("es-ES")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Google Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={wallet.googlePublishingStatus === "live" ? "default" : "secondary"}>{wallet.googlePublishingStatus === "live" ? "Producción" : "Acceso demo"}</Badge>
            <p className="text-sm text-muted-foreground">El acceso de publicación se lee desde la API de estado Wallet cuando está configurada.</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Errores recientes de API</CardTitle>
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