"use client";

import * as React from "react";
import Link from "next/link";

import { submitErrorMessage } from "@/components/dashboard/change-request-panel";
import {
  StatusChip,
  TypeChip,
} from "@/components/dashboard/request-chips";
import {
  useChangeRequest,
  useReopenChangeRequest,
  useReplyToChangeRequest,
} from "@/features/change-requests/api/useChangeRequests";
import { useTreatmentCategories } from "@/features/treatments/api/useManageTreatments";
import { ApiError } from "@/lib/api-client";
import {
  canReply,
  describeRequest,
  formatRequestDate,
  isClosed,
  isReopenable,
} from "@/lib/change-request-display";
import { MESSAGE_MAX, parseMessageBody } from "@/lib/change-requests";
import { cn } from "@/lib/utils";

const textareaClass =
  "min-h-24 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-2 text-sm outline-none focus:border-[#b8864b] disabled:opacity-60";

function BackLink() {
  return (
    <Link
      href="/dashboard/requests"
      className="text-sm font-semibold text-[#9b633e] underline-offset-2 hover:underline"
    >
      ← Mis solicitudes
    </Link>
  );
}

/** One request: what was asked, the thread with Voone, a reply box, and Reabrir while it can be reopened. */
export function RequestDetailClient({ id }: { id: string }) {
  const query = useChangeRequest(id);
  const reply = useReplyToChangeRequest(id);
  const reopen = useReopenChangeRequest(id);
  const request = query.data;
  const wantsCategory = typeof request?.proposed?.categoryId === "string";
  const categories = useTreatmentCategories(wantsCategory);
  const [draft, setDraft] = React.useState("");
  const [draftError, setDraftError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  // When the page opened: a reopen window that ends while it is open is settled by the server's 409.
  const [now] = React.useState(() => Date.now());

  if (query.isPending) {
    return (
      <section className="text-[#2e2421]">
        <BackLink />
        <p className="mt-6 text-sm text-[#927e72]">Cargando la solicitud...</p>
      </section>
    );
  }

  if (query.isError || !request) {
    const missing =
      query.error instanceof ApiError && query.error.status === 404;

    return (
      <section className="text-[#2e2421]">
        <BackLink />
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-[#ead0bd] bg-[#fff8f2] px-4 py-3 text-sm font-semibold text-[#8a4d2a]"
        >
          {missing
            ? "No se ha encontrado esta solicitud."
            : "No se pudo cargar la solicitud."}
        </p>
      </section>
    );
  }

  const closed = isClosed(request.status);
  const reopenable = isReopenable(request, now);
  const mayReply = canReply(request, now);
  const labelFor = (categoryId: string) =>
    categories.data?.find((category) => category.id === categoryId)?.label;
  const summary = describeRequest(request, labelFor);
  const busy = reply.isPending || reopen.isPending;

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    const parsed = parseMessageBody({ body: draft });

    if (!parsed.ok) {
      setDraftError(
        draft.trim()
          ? `El mensaje admite hasta ${MESSAGE_MAX} caracteres.`
          : "Escribe un mensaje.",
      );

      return;
    }

    setDraftError(null);
    setActionError(null);
    reply.mutate(parsed.value.body, {
      onSuccess: () => setDraft(""),
      onError: (failure) => setActionError(submitErrorMessage(failure)),
    });
  }

  function reopenNow() {
    if (busy) return;

    setActionError(null);
    reopen.mutate(undefined, {
      onError: (failure) => setActionError(submitErrorMessage(failure)),
    });
  }

  return (
    <section className="text-[#2e2421]">
      <BackLink />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TypeChip type={request.type} />
        <StatusChip status={request.status} />
      </div>
      <h1 className="mt-3 break-words font-serif text-4xl font-semibold tracking-[-0.03em]">
        {request.title}
      </h1>
      <p className="mt-2 text-sm text-[#927e72]">
        Creada el {formatRequestDate(request.createdAt)} por{" "}
        {request.createdByEmail}
      </p>

      <div className="mt-6 rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
        <h2 className="font-serif text-xl font-semibold">Tu solicitud</h2>
        {summary.length > 0 ? (
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
            {summary.map((line) => (
              <React.Fragment key={line.label}>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#b7874a]">
                  {line.label}
                </dt>
                <dd className="break-words font-medium">{line.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        ) : null}
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#b7874a]">
          Motivo
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">
          {request.reason}
        </p>
      </div>

      {closed ? (
        <div
          className={cn(
            "mt-4 rounded-3xl border p-5",
            request.status === "RESOLVED"
              ? "border-[#cfe5d4] bg-[#f3faf4]"
              : "border-[#ecd0ca] bg-[#fdf5f3]",
          )}
        >
          <h2 className="font-serif text-xl font-semibold">
            {request.status === "RESOLVED"
              ? "Solicitud resuelta"
              : "Solicitud rechazada"}
            {request.resolvedAt
              ? ` el ${formatRequestDate(request.resolvedAt)}`
              : ""}
          </h2>
          {request.resolutionNote ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              {request.resolutionNote}
            </p>
          ) : null}
          {reopenable && request.reopenableUntil ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={reopenNow}
                disabled={busy}
                className="rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {reopen.isPending ? "Reabriendo..." : "Reabrir"}
              </button>
              <p className="text-xs text-[#927e72]">
                Puedes reabrirla hasta el{" "}
                {formatRequestDate(request.reopenableUntil)}.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#927e72]">
              Ya no se puede reabrir. Si necesitas algo más, haz una solicitud
              nueva desde Mi centro.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-4 rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
        <h2 className="font-serif text-xl font-semibold">Conversación</h2>
        {request.messages.length === 0 ? (
          <p className="mt-3 text-sm text-[#927e72]">
            Todavía no hay mensajes. Voone te responderá aquí.
          </p>
        ) : (
          <ol className="mt-3 grid gap-3">
            {request.messages.map((message) => {
              const fromVoone = message.authorKind === "VOONE";

              return (
                <li
                  key={message.id}
                  className={cn(
                    "max-w-2xl rounded-2xl px-4 py-3 text-sm",
                    fromVoone
                      ? "bg-[#f1e3d6]"
                      : "bg-[#f4f4f1] sm:ml-auto",
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b7874a]">
                    {fromVoone
                      ? "Voone"
                      : `Tu centro${message.authorEmail ? ` · ${message.authorEmail}` : ""}`}
                    <span className="ml-2 font-medium normal-case tracking-normal text-[#927e72]">
                      {formatRequestDate(message.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                </li>
              );
            })}
          </ol>
        )}

        {mayReply ? (
          <form onSubmit={send} noValidate className="mt-5">
            <label
              htmlFor="request-reply"
              className="mb-2 block text-sm font-semibold"
            >
              Tu respuesta
            </label>
            <textarea
              id="request-reply"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setDraftError(null);
              }}
              disabled={reply.isPending}
              maxLength={MESSAGE_MAX + 200}
              rows={4}
              aria-invalid={draftError ? true : undefined}
              placeholder="Escribe un mensaje a Voone"
              className={textareaClass}
            />
            {draftError ? (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {draftError}
              </p>
            ) : null}
            {closed ? (
              <p className="mt-1 text-xs text-[#927e72]">
                Al responder, la solicitud se reabre.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-3 inline-flex h-11 items-center rounded-xl bg-[#2d211e] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {reply.isPending ? "Enviando..." : "Enviar respuesta"}
            </button>
          </form>
        ) : null}

        {actionError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#b94135]">
            {actionError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
