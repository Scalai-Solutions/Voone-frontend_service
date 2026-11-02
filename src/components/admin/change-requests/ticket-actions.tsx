"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowUpRight, Check, Loader2 } from "lucide-react";

import { cardClass, errorText } from "@/components/admin/change-requests/chips";
import { TicketFlag } from "@/components/admin/change-requests/ticket-flag";
import {
  SEARCH_PICKER_LABELS_EN,
  SearchPicker,
} from "@/components/ui/search-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  useApply,
  useCreateDraft,
} from "@/features/change-requests/api/useAdminChangeRequests";
import { appliedLine, type RequestDescription } from "@/lib/change-request-describe";
import {
  canApplyType,
  canDraftType,
  isUnresolved,
  type ApplyResult,
  type ChangeRequestDetail,
} from "@/lib/admin-change-requests";

/** A calm amber note, for warnings that never block. */
export function AmberNote({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div
      role="note"
      className="rounded-2xl border border-[#e8cf9a] bg-[#fff7e7] p-4 text-sm text-[#7a5a1e]"
    >
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {title}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Apply change" for SERVICE_* and BONO tickets: shows exactly what will be applied and the
 * catalogue warnings, and applies on confirmation. The backend applies the change and
 * resolves the ticket in one transaction, so a refusal (409) leaves the ticket open.
 */
function ApplyPanel({
  ticket,
  description,
  lookupState,
  categories,
  onProblem,
  result,
  onResult,
}: {
  ticket: ChangeRequestDetail;
  description: RequestDescription;
  lookupState: "ready" | "loading" | "failed";
  /** The catalogue's categories, for a SERVICE_ADD that needs one chosen. */
  categories: Array<{ id: string; label: string }>;
  /** The parent shows the error: a refresh after "already applied" replaces this panel. */
  onProblem: (problem: string | null) => void;
  /** Kept by the parent: applying resolves the ticket, which would otherwise unmount this. */
  result: ApplyResult | null;
  onResult: (result: ApplyResult) => void;
}) {
  const apply = useApply(ticket.id);
  const [confirming, setConfirming] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const categoryItems = React.useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.label })),
    [categories],
  );
  // Only a SERVICE_ADD at a catalogue centre with no category proposed (the backend says so).
  const needsCategory = ticket.needsCategory === true;

  function run() {
    onProblem(null);
    apply.mutate(
      {
        note: note.trim() || undefined,
        ...(needsCategory ? { categoryId } : {}),
      },
      {
        onSuccess: (done) => {
          onResult(done);
          setConfirming(false);
        },
        onError: (error) => {
          onProblem(errorText(error, "Could not apply the change. Try again."));
          setConfirming(false);
        },
      },
    );
  }

  if (result) {
    return (
      <div className="space-y-3" role="status">
        <p className="flex items-start gap-2 text-sm font-semibold text-[#2f6b3c]">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Applied: {result.applied.summary}. The request is now resolved and the owner has been notified.</span>
        </p>
        {result.warnings.length > 0 ? (
          <AmberNote title="Worth a look" items={result.warnings} />
        ) : null}
      </div>
    );
  }

  const blocked = description.missing.length > 0;
  const waiting = lookupState !== "ready";
  const categoryMissing = needsCategory && !categoryId;

  return (
    <div>
      <button
        type="button"
        disabled={blocked || waiting || apply.isPending}
        onClick={() => {
          setConfirming(true);
          onProblem(null);
        }}
        className="rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        Apply change
      </button>
      {waiting ? (
        <p className="mt-2 text-xs text-[#806d63]">
          {lookupState === "loading"
            ? "Loading the clinic's current catalogue so the change can be previewed..."
            : "Could not load the clinic's current catalogue, so the change cannot be previewed. Reload the page to try again."}
        </p>
      ) : null}
      {blocked ? (
        <p className="mt-2 text-xs text-[#806d63]">
          The item this request points at is no longer in the catalogue, so it cannot be applied.
          Resolve or reject it instead.
        </p>
      ) : null}

      {confirming ? (
        <div
          role="alertdialog"
          aria-label="Confirm applying the change"
          className="mt-4 space-y-3 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4"
        >
          <p className="text-sm font-semibold">This will be applied to the live catalogue:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {description.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {ticket.catalogueImpact && ticket.catalogueImpact.length > 0 ? (
            <AmberNote title="Effect on the live programme" items={ticket.catalogueImpact} />
          ) : null}
          <TicketFlag id={ticket.id} type={ticket.type} variant="inline" />
          {needsCategory ? (
            <div>
              <label htmlFor={`apply-category-${ticket.id}`} className="text-sm font-semibold">
                Category (required: the owner did not choose one)
              </label>
              <SearchPicker
                id={`apply-category-${ticket.id}`}
                value={categoryId}
                onChange={setCategoryId}
                items={categoryItems}
                placeholder={
                  categories.length === 0 ? "Loading categories..." : "Choose a category"
                }
                searchPlaceholder="Search categories…"
                emptyMessage="No category matches that search."
                labels={SEARCH_PICKER_LABELS_EN}
                disabled={categories.length === 0}
                className="mt-2 [&>button]:h-10 [&>button]:rounded-xl [&>button]:border-[#ded1c8] [&>button]:bg-white"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor={`apply-note-${ticket.id}`} className="text-sm font-semibold">
              Note for the owner (optional)
            </label>
            <Textarea
              id={`apply-note-${ticket.id}`}
              value={note}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Left empty, the owner is told what was applied."
              className="mt-2 min-h-16"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={run}
              disabled={apply.isPending || categoryMissing}
              className="inline-flex items-center rounded-full bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {apply.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {apply.isPending ? "Applying..." : "Confirm and apply"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** "Create programme draft" for REWARD and LEVEL tickets, and the link to the linked programme. */
function DraftPanel({ ticket }: { ticket: ChangeRequestDetail }) {
  const router = useRouter();
  const createDraft = useCreateDraft(ticket.id);
  const [problem, setProblem] = React.useState<string | null>(null);
  const programHref = `/admin/clinics/${encodeURIComponent(ticket.clinicId)}/program`;
  const open = isUnresolved(ticket.status);

  return (
    <div className="space-y-3">
      {ticket.programId ? (
        <p className="text-sm">
          Linked programme: <span className="font-mono text-xs">{ticket.programId}</span>
          {open ? ". Edit it, publish it, and you will be offered to resolve this request." : "."}
        </p>
      ) : null}

      {open && !ticket.programId ? (
        <>
          <p className="text-sm text-[#806d63]">
            Starts a draft of the clinic&apos;s programme (a copy of the live one) and links it to
            this request. The owner&apos;s proposal is not applied automatically: you edit the draft.
          </p>
          <button
            type="button"
            disabled={createDraft.isPending}
            onClick={() => {
              setProblem(null);
              createDraft.mutate(undefined, {
                // Straight to the programme editor, where the new draft is waiting.
                onSuccess: () => router.push(programHref),
                onError: (error) =>
                  setProblem(errorText(error, "Could not create the draft. Try again.")),
              });
            }}
            className="inline-flex items-center rounded-full bg-[#2d211e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {createDraft.isPending ? "Creating..." : "Create programme draft"}
          </button>
        </>
      ) : null}

      {ticket.programId ? (
        <Link
          href={programHref}
          className="inline-flex items-center rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"
        >
          Open the programme editor <ArrowUpRight className="ml-2 h-4 w-4" />
        </Link>
      ) : null}

      {problem ? (
        <p role="alert" className="text-sm font-semibold text-[#b94135]">
          {problem}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The actions that depend on the ticket's type: apply for service and bono tickets, a
 * programme draft for reward and level tickets. Nothing for other types.
 */
export function TypeActions({
  ticket,
  description,
  lookupState,
  categories,
}: {
  ticket: ChangeRequestDetail;
  description: RequestDescription;
  lookupState: "ready" | "loading" | "failed";
  categories: Array<{ id: string; label: string }>;
}) {
  const [applyResult, setApplyResult] = React.useState<ApplyResult | null>(null);
  const [applyProblem, setApplyProblem] = React.useState<string | null>(null);
  const applied = appliedLine(ticket);
  // A ticket already applied (appliedAt) never offers Apply again; an older backend sends no
  // appliedAt, and then a closed ticket simply has nothing to apply either.
  const showApply =
    canApplyType(ticket.type) &&
    (applyResult !== null || (isUnresolved(ticket.status) && !ticket.appliedAt));
  const showDraft =
    canDraftType(ticket.type) && (isUnresolved(ticket.status) || ticket.programId);

  if (
    !showApply &&
    !showDraft &&
    !(applied && canApplyType(ticket.type)) &&
    !applyProblem
  )
    return null;

  return (
    <div className={cardClass}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">
        {canApplyType(ticket.type) ? "Apply" : "Programme"}
      </p>
      <div className="mt-3">
        {applied && !applyResult ? (
          <p role="status" className="text-sm font-semibold text-[#2f6b3c]">
            {applied}
          </p>
        ) : null}
        {showApply ? (
          <ApplyPanel
            ticket={ticket}
            description={description}
            lookupState={lookupState}
            categories={categories}
            onProblem={setApplyProblem}
            result={applyResult}
            onResult={setApplyResult}
          />
        ) : null}
        {showDraft ? <DraftPanel ticket={ticket} /> : null}
        {applyProblem && !applyResult ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#b94135]">
            {applyProblem}
          </p>
        ) : null}
      </div>
    </div>
  );
}
