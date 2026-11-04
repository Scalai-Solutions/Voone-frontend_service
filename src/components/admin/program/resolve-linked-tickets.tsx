"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import {
  StatusChip,
  TypeChip,
  errorText,
} from "@/components/admin/change-requests/chips";
import { Textarea } from "@/components/ui/textarea";
import {
  useLinkedTickets,
  useResolveLinked,
} from "@/features/change-requests/api/useAdminChangeRequests";

/**
 * Shown right after a programme is published: if the clinic has open requests linked to it
 * (made with "Create programme draft"), offer to resolve them with a note and tell the owners.
 * With none, or if the tickets cannot be read, it calls `onDone` at once so the publish flow
 * continues exactly as before: this prompt is never a reason a publish seems to fail.
 */
export function ResolveLinkedTickets({
  clinicId,
  programId,
  onDone,
}: {
  clinicId: string;
  programId: string;
  onDone: () => void;
}) {
  const linked = useLinkedTickets(clinicId, programId);
  const resolve = useResolveLinked(clinicId, programId);
  const [note, setNote] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const [resolvedCount, setResolvedCount] = React.useState<number | null>(null);

  const nothingToOffer =
    linked.isError || (linked.isSuccess && linked.data.length === 0);

  React.useEffect(() => {
    if (nothingToOffer) onDone();
    // onDone is a fresh closure each render; the decision depends only on the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nothingToOffer]);

  if (nothingToOffer || linked.isPending) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Programa publicado. Un momento…</span>
      </p>
    );
  }

  if (resolvedCount !== null) {
    return (
      <div role="status" className="grid gap-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2f6b3c]">
          <Check className="h-4 w-4" />
          {resolvedCount}{" "}
          {resolvedCount === 1 ? "solicitud resuelta" : "solicitudes resueltas"}.
          Se ha avisado a los propietarios.
        </p>
        <div>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!note.trim()) {
      setProblem("Escribe primero una nota: se envía por correo a los propietarios.");

      return;
    }

    setProblem(null);
    resolve.mutate(note.trim(), {
      onSuccess: (result) => setResolvedCount(result.resolved.length),
      onError: (error) =>
        setProblem(errorText(error, "No se han podido resolver las solicitudes. Inténtalo de nuevo.")),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-5"
    >
      <div>
        <h3 className="font-serif text-2xl font-semibold">
          El programa ya está activo
        </h3>
        <p className="mt-1 text-sm text-[#806d63]">
          {linked.data.length === 1
            ? "Esta solicitud estaba vinculada al programa que acabas de publicar."
            : "Estas solicitudes estaban vinculadas al programa que acabas de publicar."}{" "}
          {linked.data.length === 1 ? "Resuélvela" : "Resuélvelas"} ahora y se
          avisará a los propietarios del centro de que el cambio ya está activo.
        </p>
      </div>

      <ul className="grid gap-2">
        {linked.data.map((ticket) => (
          <li
            key={ticket.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e4d8d1] bg-white px-4 py-3 text-sm"
          >
            <span className="font-semibold">{ticket.title}</span>
            <span className="flex items-center gap-2">
              <TypeChip type={ticket.type} />
              <StatusChip status={ticket.status} />
            </span>
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor="resolve-linked-note" className="text-sm font-semibold">
          Nota de resolución (obligatoria; la reciben los propietarios)
        </label>
        <Textarea
          id="resolve-linked-note"
          value={note}
          maxLength={2000}
          onChange={(event) => {
            setNote(event.target.value);
            setProblem(null);
          }}
          placeholder="Por ejemplo: el nuevo premio ya está activo en tu programa."
          className="mt-2 min-h-20"
        />
      </div>

      {problem ? (
        <p role="alert" className="text-sm font-semibold text-[#b94135]">
          {problem}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={resolve.isPending}
          className="inline-flex items-center rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {resolve.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {resolve.isPending ? "Resolviendo…" : "Resolver y avisar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={resolve.isPending}
          className="rounded-full border border-[#cdb9aa] px-5 py-2.5 text-sm font-semibold text-[#754b36] disabled:opacity-60"
        >
          Ahora no
        </button>
      </div>
    </form>
  );
}
