"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, WalletCards } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { ProgramVisitPanel } from "@/components/dashboard/program-visit-panel";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberPassLink, newIdempotencyKey } from "@/lib/api-client";
import { useCreditMember } from "@/features/members/api/useCreditMember";
import { useDeleteMember } from "@/features/members/api/useDeleteMember";
import { useMember } from "@/features/members/api/useMember";
import { useStaffProgram } from "@/features/program/api/useStaffProgram";
import { type Member } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

const sexLabels: Record<NonNullable<Member["sex"]>, string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  otro: "Otro",
  prefiero_no_decirlo: "Prefiere no decirlo",
};

const ageFromBirthDate = (birthDate: string) => {
  const today = new Date();
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  let age = today.getFullYear() - date.getUTCFullYear();
  const birthdayThisYear = new Date(Date.UTC(today.getFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (today.getTime() < birthdayThisYear.getTime()) age -= 1;

  return age;
};

const memberAge = (member: Member) => {
  if (member.birthDate) return ageFromBirthDate(member.birthDate);
  if (member.birthYear) return new Date().getFullYear() - member.birthYear;

  return "-";
};

export function MemberDetail({ memberId }: { memberId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [manualPoints, setManualPoints] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [notice, setNotice] = useState("");
  const member = useMember(memberId);
  // A centre with an active programme records visits in euros; one without keeps the older
  // points form. Not decided until the lookup has answered, so neither form flashes.
  const staffProgram = useStaffProgram();
  const hasProgram = Boolean(staffProgram.data);
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
  const deleteMemberMutation = useDeleteMember();

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

  function deleteCurrentMember() {
    if (!window.confirm("¿Eliminar este miembro? Se borrará de la clínica y sus pases Wallet se revocarán cuando sea posible.")) {
      return;
    }

    deleteMemberMutation.mutate(memberId, {
      onError: () => setNotice("No se pudo eliminar el miembro. Inténtalo de nuevo."),
      onSuccess: () => router.push("/dashboard/members"),
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
            {/* The five-character code printed on the member's card. Falls back to the
                internal id for members the backfill has not reached — a uuid, which is
                what this field used to show and the reason the code exists. */}
            <p className="text-lg font-semibold tracking-widest">{member.data.code ?? member.data.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Puntos actuales</p>
            <p className="text-3xl font-semibold tracking-tight">{member.data.points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nivel</p>
            <p className="font-medium">{member.data.tier || "-"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background/70 p-3 text-sm">
            <div>
              <p className="text-muted-foreground">Sexo</p>
              <p className="font-medium">{member.data.sex ? sexLabels[member.data.sex] : "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Edad</p>
              <p className="font-medium">{memberAge(member.data)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Fecha de nacimiento</p>
              <p className="font-medium">{member.data.birthDate ?? (member.data.birthYear ? String(member.data.birthYear) : "-")}</p>
            </div>
          </div>
          <WalletStatusBadges statuses={member.data.walletStatus} />
          <ReaddCard memberId={memberId} />
          {hasProgram ? <ProgramVisitPanel memberId={memberId} /> : null}
          {!hasProgram && !staffProgram.isLoading ? <form onSubmit={submitManualPoints} className="rounded-lg border border-border bg-background/70 p-4">
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
          </form> : null}
          {hasProgram && notice ? <p role="status" className="rounded-md bg-muted/70 p-3 text-sm text-muted-foreground">{notice}</p> : null}
          <Button
            type="button"
            variant="destructive"
            onClick={deleteCurrentMember}
            disabled={deleteMemberMutation.isPending}
          >
            {deleteMemberMutation.isPending ? "Eliminando" : "Eliminar miembro"}
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

/**
 * For a client who deleted their card or changed phone: a QR they scan at the desk, which opens
 * the same add-to-wallet page they were sent at sign-up. Generated only when asked, because
 * building it re-issues the card with the member's current points.
 */
function ReaddCard({ memberId }: { memberId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const show = async () => {
    setBusy(true);
    setProblem(null);

    try {
      setUrl((await getMemberPassLink(memberId)).addToWalletUrl);
    } catch {
      setProblem("No se ha podido generar el enlace. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background/70 p-4">
      <p className="text-sm font-semibold">¿Ha perdido la tarjeta?</p>
      {url ? (
        <div className="grid justify-items-start gap-2">
          <QrCode value={url} size={192} title="Enlace para añadir la tarjeta a Wallet" />
          <p className="text-xs text-muted-foreground">
            Pide a la clienta que escanee el código con la cámara del móvil y pulse «Añadir a Wallet».
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => setUrl(null)}>
            Ocultar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => void show()} disabled={busy}>
          <WalletCards className="mr-2 h-4 w-4" />
          {busy ? "Generando…" : "Volver a añadir la tarjeta a Wallet"}
        </Button>
      )}
      {problem ? (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
