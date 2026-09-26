"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { newIdempotencyKey } from "@/lib/api-client";
import { useCreditMember } from "@/features/members/api/useCreditMember";
import { useMember } from "@/features/members/api/useMember";
import { type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function MemberDetail({ memberId }: { memberId: string }) {
  const queryClient = useQueryClient();
  const [deactivated, setDeactivated] = useState(false);
  const [manualPoints, setManualPoints] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [notice, setNotice] = useState("");
  const member = useMember(memberId);
  const adjustmentKeyRef = useRef<string | null>(null);

  const manualPointsMutation = useCreditMember({
    onError: () => {
      setNotice("No se pudieron añadir los puntos. Inténtalo de nuevo.");
    },
    onSuccess: (updatedMember) => {
      // Retired once spent, so a second and genuinely different adjustment is not
      // mistaken for a duplicate of the first.
      adjustmentKeyRef.current = null;
      queryClient.setQueryData<Member>(queryKeys.member(memberId), updatedMember);
      setManualPoints("");
      setManualReason("");
      setNotice(`Cambio manual registrado. Nuevo saldo: ${updatedMember.points.toLocaleString("es-ES")} puntos.`);
    },
  });

  if (member.isLoading) return <Skeleton className="h-80 w-full" />;
  if (member.error || !member.data) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">No se pudo cargar el miembro.</div>;

  function submitManualPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const points = Number.parseInt(manualPoints, 10);
    const reason = manualReason.trim();

    if (!Number.isFinite(points) || points <= 0 || !reason) {
      setNotice("Indica una cantidad positiva y un motivo para registrar el cambio.");
      return;
    }

    // Same attempt on a retry, a new one after a success.
    adjustmentKeyRef.current ??= newIdempotencyKey();

    manualPointsMutation.mutate({
      memberId,
      points,
      label: `Ajuste manual: ${reason}`,
      idempotencyKey: adjustmentKeyRef.current,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{member.data.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">ID de miembro</p>
            <p className="text-lg font-semibold">{member.data.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Puntos actuales</p>
            <p className="text-3xl font-semibold tracking-tight">{member.data.points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nivel</p>
            <p className="font-medium">{member.data.tier}</p>
          </div>
          <WalletStatusBadges statuses={member.data.walletStatus} />
          {deactivated ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">Miembro marcado como inactivo localmente.</p> : null}
          <form onSubmit={submitManualPoints} className="rounded-lg border border-border bg-background/70 p-4">
            <p className="text-sm font-semibold">Añadir puntos manualmente</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
              <label className="text-xs font-medium text-muted-foreground">
                Puntos
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={manualPoints}
                  onChange={(event) => {
                    setManualPoints(event.target.value);
                    setNotice("");
                  }}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Motivo
                <input
                  value={manualReason}
                  onChange={(event) => {
                    setManualReason(event.target.value);
                    setNotice("");
                  }}
                  placeholder="Corrección aprobada, bono especial..."
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <Button type="submit" className="mt-3 w-full" disabled={manualPointsMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> {manualPointsMutation.isPending ? "Guardando" : "Registrar ajuste"}
            </Button>
            {notice ? <p role="status" className="mt-3 rounded-md bg-muted/70 p-3 text-sm text-muted-foreground">{notice}</p> : null}
          </form>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (window.confirm("¿Desactivar este miembro? Su pase dejará de acumular puntos.")) {
                setDeactivated(true);
              }
            }}
          >
            Desactivar miembro
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {member.data.history.length ? member.data.history.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-border bg-background/70 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground">{item.date} · Registro bloqueado</p>
              </div>
              <span className="font-semibold text-success">+{item.points}</span>
            </div>
          )) : <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no hay movimientos de puntos.</p>}
        </CardContent>
      </Card>
    </div>
  );
}