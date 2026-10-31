"use client";

import * as React from "react";

import { errorText } from "@/components/admin/change-requests/chips";
import { Textarea } from "@/components/ui/textarea";
import { useSetStatus } from "@/features/change-requests/api/useAdminChangeRequests";
import {
  actionNeedsNote,
  actionTarget,
  statusActions,
  type ChangeRequestStatus,
  type StatusAction,
} from "@/lib/change-requests";

const LABEL: Record<StatusAction, string> = {
  start: "Start work",
  back_to_open: "Move back to Open",
  resolve: "Resolve",
  reject: "Reject",
  reopen: "Reopen",
};

const NOTE_LABEL: Record<"resolve" | "reject", string> = {
  resolve: "Resolution note (the owner receives this)",
  reject: "Reason for rejecting (the owner receives this)",
};

/**
 * Moves a ticket along. Resolve and Reject ask for a note first, inline: the backend refuses
 * either without one, and the owner is emailed the note.
 */
export function StatusControls({
  id,
  status,
}: {
  id: string;
  status: ChangeRequestStatus;
}) {
  const setStatus = useSetStatus(id);
  const [asking, setAsking] = React.useState<"resolve" | "reject" | null>(null);
  const [note, setNote] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  const actions = statusActions(status);

  function run(action: StatusAction, resolutionNote?: string) {
    setProblem(null);
    setStatus.mutate(
      {
        status: actionTarget[action],
        ...(resolutionNote ? { resolutionNote } : {}),
      },
      {
        onSuccess: () => {
          setAsking(null);
          setNote("");
        },
        onError: (error) => setProblem(errorText(error, "Could not change the status. Try again.")),
      },
    );
  }

  function choose(action: StatusAction) {
    setProblem(null);

    if (actionNeedsNote(action)) {
      setAsking(action as "resolve" | "reject");

      return;
    }

    setAsking(null);
    run(action);
  }

  function confirm() {
    if (!asking) return;

    if (!note.trim()) {
      setProblem("Write a note first: the owner is emailed it.");

      return;
    }

    run(asking, note.trim());
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Status</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={setStatus.isPending}
            aria-pressed={asking === action}
            onClick={() => choose(action)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
              action === "reject"
                ? "border-[#e2b9b1] text-[#8a3a30]"
                : "border-[#cdb9aa] text-[#754b36]"
            }`}
          >
            {LABEL[action]}
          </button>
        ))}
      </div>

      {asking ? (
        <div className="mt-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4">
          <label htmlFor={`note-${id}`} className="text-sm font-semibold">
            {NOTE_LABEL[asking]}
          </label>
          <Textarea
            id={`note-${id}`}
            value={note}
            maxLength={2000}
            onChange={(event) => {
              setNote(event.target.value);
              setProblem(null);
            }}
            className="mt-2"
            placeholder={
              asking === "resolve"
                ? "What was done, in a sentence or two."
                : "Why this cannot be done."
            }
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={setStatus.isPending}
              className="rounded-full bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {setStatus.isPending
                ? "Saving..."
                : asking === "resolve"
                  ? "Confirm resolve"
                  : "Confirm reject"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAsking(null);
                setProblem(null);
              }}
              className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {problem ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-[#b94135]">
          {problem}
        </p>
      ) : null}
    </div>
  );
}
