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

const APPLE_NO_UPDATES_HINT =
  "Esta tarjeta no está registrada para recibir actualizaciones. El cliente puede volver a añadirla con «Volver a añadir la tarjeta a Wallet», o activar «Actualizaciones automáticas» en los ajustes de la tarjeta en su iPhone.";

export function WalletStatusBadges({
  statuses,
  appleUpdatesRegistered,
}: {
  statuses: Record<WalletProvider, ProviderStatus>;
  appleUpdatesRegistered?: boolean | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(statuses) as [WalletProvider, ProviderStatus][]).map(([provider, status]) => {
        if (provider === "apple" && status === "added" && appleUpdatesRegistered === false) {
          return (
            <Badge
              key={provider}
              variant="outline"
              title={APPLE_NO_UPDATES_HINT}
              className="border-warning bg-warning/15 text-foreground"
            >
              {PROVIDER_LABELS[provider]} - {STATUS_LABELS[status]} · sin actualización automática
            </Badge>
          );
        }

        return (
          <Badge
            key={provider}
            variant={status === "added" ? "default" : status === "failed" ? "destructive" : "secondary"}
            className={status === "unavailable" ? "bg-muted text-muted-foreground" : undefined}
          >
            {PROVIDER_LABELS[provider]} - {STATUS_LABELS[status]}
          </Badge>
        );
      })}
    </div>
  );
}
