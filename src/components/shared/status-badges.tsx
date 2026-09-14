import { Badge } from "@/components/ui/badge";
import type { ProviderStatus, WalletProvider } from "@/lib/api-client";

const PROVIDER_LABELS: Record<WalletProvider, string> = {
  google: "Google Wallet",
  apple: "Apple Wallet",
};

const STATUS_LABELS: Record<ProviderStatus, string> = {
  added: "Añadido",
  not_added: "Sin añadir",
  unavailable: "Próximamente",
  failed: "Requiere atención",
};

export function WalletStatusBadges({ statuses }: { statuses: Record<WalletProvider, ProviderStatus> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(statuses) as [WalletProvider, ProviderStatus][]).map(([provider, status]) => (
        <Badge
          key={provider}
          variant={status === "added" ? "default" : status === "failed" ? "destructive" : "secondary"}
          className={status === "unavailable" ? "bg-muted text-muted-foreground" : undefined}
        >
          {PROVIDER_LABELS[provider]} - {STATUS_LABELS[status]}
        </Badge>
      ))}
    </div>
  );
}