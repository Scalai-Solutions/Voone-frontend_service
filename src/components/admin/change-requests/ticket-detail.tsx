"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";

import {
  StatusChip,
  TypeChip,
  cardClass,
  errorText,
} from "@/components/admin/change-requests/chips";
import { StatusControls } from "@/components/admin/change-requests/status-controls";
import {
  AmberNote,
  TypeActions,
} from "@/components/admin/change-requests/ticket-actions";
import { Textarea } from "@/components/ui/textarea";
import {
  useClinicBonoPlans,
  useClinicTreatmentCategories,
  useClinicTreatments,
} from "@/features/admin-services/api/useAdminServices";
import {
  useChangeRequest,
  useReply,
} from "@/features/change-requests/api/useAdminChangeRequests";
import {
  describeRequest,
  emailStatusLine,
  formatTimestamp,
  resolutionMessageId,
  type DescribeLookup,
} from "@/lib/change-request-describe";
import {
  isUnresolved,
  type ChangeRequestDetail,
  type ChangeRequestMessage,
} from "@/lib/admin-change-requests";

type LookupState = "ready" | "loading" | "failed";

/** Current treatments and bonos, so "45 € → 50 €" can show the 45. Only fetched for the types that need them. */
function useLookup(ticket: ChangeRequestDetail | undefined): {
  lookup: DescribeLookup;
  state: LookupState;
} {
  const clinicId = ticket?.clinicId ?? "";
  const type = ticket?.type;
  const needsTreatments =
    type === "SERVICE_EDIT" || type === "SERVICE_REMOVE" || type === "SERVICE_ADD";
  const treatments = useClinicTreatments(clinicId, Boolean(ticket) && needsTreatments);
  const categories = useClinicTreatmentCategories(
    clinicId,
    Boolean(ticket) &&
      needsTreatments &&
      (Boolean(treatments.data?.usesCatalogue) || ticket?.needsCategory === true),
  );
  const bonos = useClinicBonoPlans(clinicId, Boolean(ticket) && type === "BONO");

  // Edits, removals and bono changes can only be previewed (old to new) and checked for a
  // missing target once the current catalogue is here.
  const required =
    type === "SERVICE_EDIT" || type === "SERVICE_REMOVE"
      ? treatments
      : type === "BONO"
        ? bonos
        : null;
  const state: LookupState = !required
    ? "ready"
    : required.isError
      ? "failed"
      : required.data
        ? "ready"
        : "loading";

  const lookup = React.useMemo(
    () => ({
      treatments: treatments.data
        ? new Map(treatments.data.items.map((item) => [item.id, item]))
        : undefined,
      bonos: bonos.data ? new Map(bonos.data.map((plan) => [plan.id, plan])) : undefined,
      categories: categories.data
        ? new Map(categories.data.map((category) => [category.id, category.label]))
        : undefined,
    }),
    [treatments.data, bonos.data, categories.data],
  );

  return { lookup, state };
}

function Message({
  message,
  isResolution,
}: {
  message: ChangeRequestMessage;
  /** The note the ticket was closed with, written into the thread by the backend. */
  isResolution: boolean;
}) {
  const fromVoone = message.authorKind === "VOONE";

  return (
    <li className={fromVoone ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[86%] rounded-2xl p-4 text-sm ${
          isResolution
            ? "border border-dashed border-[#c9a77f] bg-[#fbf1e4] text-[#402d26]"
            : fromVoone
              ? "bg-[#f1d6bd] text-[#402d26]"
              : "border border-[#e4d8d1] bg-white text-[#2e2421]"
        }`}
      >
        <p className="text-xs font-semibold">
          {isResolution ? "Resolution" : fromVoone ? "Voone" : "Clinic"}
          <span className="font-normal opacity-70">
            {" "}
            · {message.authorEmail} · {formatTimestamp(message.createdAt)}
          </span>
        </p>
        <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
      </div>
    </li>
  );
}

function ReplyBox({ id }: { id: string }) {
  const reply = useReply(id);
  const [body, setBody] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  function send(event: React.FormEvent) {
    event.preventDefault();

    if (!body.trim()) {
      setProblem("Write a message first.");

      return;
    }

    setProblem(null);
    reply.mutate(body.trim(), {
      onSuccess: () => setBody(""),
      onError: (error) => setProblem(errorText(error, "Could not send the reply. Try again.")),
    });
  }

  return (
    <form onSubmit={send} className="mt-5 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-3">
      <label htmlFor={`reply-${id}`} className="sr-only">
        Reply to the clinic
      </label>
      <Textarea
        id={`reply-${id}`}
        value={body}
        maxLength={2000}
        onChange={(event) => {
          setBody(event.target.value);
          setProblem(null);
        }}
        placeholder="Write a reply to the clinic"
        className="min-h-24"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#806d63]">
          The owner is emailed (in Spanish). A reply does not change the status.
        </p>
        <button
          type="submit"
          disabled={reply.isPending}
          className="inline-flex items-center rounded-full bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {reply.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send reply
        </button>
      </div>
      {problem ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-[#b94135]">
          {problem}
        </p>
      ) : null}
    </form>
  );
}

export function TicketDetail({ id }: { id: string }) {
  const query = useChangeRequest(id);
  const ticket = query.data;
  const { lookup, state: lookupState } = useLookup(ticket);
  const categoryOptions = React.useMemo(
    () => Array.from(lookup.categories ?? [], ([id, label]) => ({ id, label })),
    [lookup.categories],
  );

  const back = (
    <Link
      href="/admin/customer-care"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#754b36]"
    >
      <ArrowLeft className="h-4 w-4" /> Customer Care
    </Link>
  );

  if (query.isPending) {
    return (
      <div>
        {back}
        <p className="flex items-center gap-2 text-sm text-[#806d63]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading request...
        </p>
      </div>
    );
  }

  if (query.isError || !ticket) {
    return (
      <div>
        {back}
        <p role="alert" className="text-sm font-semibold text-[#b94135]">
          {errorText(query.error, "Could not load this request.")}
        </p>
      </div>
    );
  }

  const description = describeRequest(ticket.type, ticket.targetRef, ticket.proposed, lookup);
  const unresolved = isUnresolved(ticket.status);
  const impact = ticket.catalogueImpact ?? [];
  const resolutionId = resolutionMessageId(ticket, ticket.messages);

  return (
    <div className="space-y-5">
      {back}

      <header className={cardClass}>
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip type={ticket.type} />
          <StatusChip status={ticket.status} />
        </div>
        <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">{ticket.title}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Clinic</dt>
            <dd className="mt-1">
              <Link
                href={`/admin/clinics/${encodeURIComponent(ticket.clinicId)}`}
                className="font-semibold text-[#754b36] underline-offset-4 hover:underline"
              >
                {ticket.clinic.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Created by</dt>
            <dd className="mt-1">
              {ticket.createdByEmail}{" "}
              <span className="text-[#806d63]">({ticket.createdByRole.toLowerCase()})</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Created</dt>
            <dd className="mt-1">{formatTimestamp(ticket.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Last updated</dt>
            <dd className="mt-1">{formatTimestamp(ticket.updatedAt)}</dd>
          </div>
          {ticket.resolvedAt ? (
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">
                {ticket.status === "REJECTED" ? "Rejected" : "Resolved"}
              </dt>
              <dd className="mt-1">
                {formatTimestamp(ticket.resolvedAt)}
                {ticket.resolvedByEmail ? ` by ${ticket.resolvedByEmail}` : ""}
                {ticket.resolutionNote ? (
                  <span className="mt-1 block whitespace-pre-wrap text-[#806d63]">
                    {ticket.resolutionNote}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className={cardClass}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">The request</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold tracking-tight">{description.headline}</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          {description.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {unresolved && description.missing.length > 0 ? (
          <div className="mt-4">
            <AmberNote
              title="Out of date"
              items={["The item this request points at no longer exists in the clinic's catalogue."]}
            />
          </div>
        ) : null}

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">
          Owner&apos;s reason
        </p>
        <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-[#d9c9b6] pl-4 text-sm text-[#4d3b35]">
          {ticket.reason}
        </blockquote>

        {unresolved && impact.length > 0 ? (
          <div className="mt-5">
            <AmberNote title="Effect on the live programme" items={impact} />
          </div>
        ) : null}
      </section>

      <TypeActions
        ticket={ticket}
        description={description}
        lookupState={lookupState}
        categories={categoryOptions}
      />

      <section className={cardClass}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">
          Conversation · {ticket.messages.length}
        </p>
        {ticket.messages.length === 0 ? (
          <p className="mt-3 text-sm text-[#806d63]">No messages yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ticket.messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isResolution={message.id === resolutionId}
              />
            ))}
          </ul>
        )}
        <ReplyBox id={ticket.id} />
      </section>

      <section className={cardClass}>
        <StatusControls id={ticket.id} status={ticket.status} />
      </section>

      <p className="px-1 text-xs text-[#9a8a82]">{emailStatusLine(ticket)}</p>
    </div>
  );
}
