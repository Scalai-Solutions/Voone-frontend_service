import { Badge } from "@/components/ui/badge";
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
      <PageHeader eyebrow="Wallet" title="Wallet Integration" description="Google and Apple Wallet status, certificate readiness, and recent integration problems." />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Provider</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Apple Wallet</h2>
            </div>
            <Badge variant={wallet.appleEnabled ? "default" : "secondary"}>{wallet.appleEnabled ? "Activo" : "Próximamente"}</Badge>
          </div>
          <div className="mt-5 rounded-[22px] border border-warning/40 bg-[#fff7e7] p-5">
            <p className="text-sm font-medium">Certificate renewal</p>
            <p className="mt-2 font-serif text-5xl font-semibold">{expiryDays} days</p>
            <p className="mt-1 text-sm text-muted-foreground">Vence el {new Date(wallet.appleCertificateExpiresAt).toLocaleDateString("es-ES")}</p>
          </div>
        </div>

        <div className="rounded-[26px] border border-[#ded2cb] bg-[#211918] p-5 text-[#fff8f2] shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d6a979]">Provider</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Google Wallet</h2>
            </div>
            <Badge variant={wallet.googlePublishingStatus === "live" ? "default" : "secondary"}>{wallet.googlePublishingStatus === "live" ? "Producción" : "Acceso demo"}</Badge>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#c9bbb3]">Publishing mode is read from the Wallet status API when configured. Demo mode can still generate test save links for clinic QA.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[#bca99d]">Save links</p><p className="mt-2 text-3xl font-semibold">98.6%</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[#bca99d]">Last sync</p><p className="mt-2 text-3xl font-semibold">12m</p></div>
          </div>
        </div>
      </section>

      <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-semibold tracking-tight">Recent API errors</h2>
          <Badge variant="outline" className="border-[#d9c9b6] bg-[#fffaf3]">Reported here</Badge>
        </div>
        <div className="mt-5 space-y-3">
          {wallet.recentErrors.map((item) => (
            <div key={`${item.provider}-${item.label}`} className="flex items-center justify-between rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3 text-sm">
              <span>{item.provider === "google" ? "Google Wallet" : "Apple Wallet"} - {item.label}</span>
              <Badge variant={item.count ? "destructive" : "secondary"}>{item.count}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}