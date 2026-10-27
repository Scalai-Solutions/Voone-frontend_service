"use client";

import * as React from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import type { TextEdits } from "@/lib/onboarding-api";
import type { TextsPayload } from "./texts";

/**
 * What the draft's text editors share: how to save, and whether a save is in flight. Saves are
 * serialised across the whole screen, because every one rewrites the same draft and the backend
 * refuses a second write that started from the same version.
 */
export interface TextsEditing {
  save: (edits: TextEdits) => Promise<unknown>;
  busy: boolean;
}

/**
 * A text on a draft that can be edited in place: a pencil turns it into an input, Enter or the
 * confirm button saves, Escape or cancel discards. Without `editing` (an active programme) it is
 * just the text. The backend's message is shown when a save fails.
 *
 * `build` turns the typed text (or `null`, for "restore the original name") into the request
 * body, and says why when the text is not acceptable.
 */
export function EditableText({
  value,
  label,
  maxLength,
  build,
  editing,
  restorable = false,
  children,
  className,
}: {
  value: string;
  /** What is being edited, for assistive technology: "el premio", "la ventaja"... */
  label: string;
  maxLength: number;
  build: (text: string | null) => TextsPayload;
  editing?: TextsEditing;
  /** Offers "Restaurar nombre original" (rewards only). */
  restorable?: boolean;
  /** How the text is shown when it is not being edited. Defaults to the text itself. */
  children?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  if (!editing) {
    return <span className={className}>{children ?? value}</span>;
  }

  const busy = editing.busy;

  const run = async (text: string | null, failure: string) => {
    if (busy) return false;

    const payload = build(text);

    if (!payload.ok) {
      setProblem(payload.error);
      return false;
    }

    setProblem(null);

    try {
      await editing.save(payload.edits);
      return true;
    } catch (error) {
      setProblem(
        error instanceof ApiError && error.detail ? error.detail : failure,
      );
      return false;
    }
  };

  const start = () => {
    setProblem(null);
    setDraft(value);
    setOpen(true);
  };

  const cancel = () => {
    setOpen(false);
    setProblem(null);
  };

  const confirm = async () => {
    // Nothing changed: close without a request.
    if (draft.trim() === value) {
      cancel();
      return;
    }

    if (await run(draft, "No se ha podido guardar el cambio.")) setOpen(false);
  };

  if (open) {
    return (
      <span className="grid gap-1">
        <span className="flex items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            maxLength={maxLength}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void confirm();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
            aria-label={`Editar ${label}`}
            className="min-w-0 flex-1 rounded-md border border-input bg-card px-2 py-1 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-7 w-7 shrink-0"
            disabled={busy || !draft.trim()}
            onClick={() => void confirm()}
            aria-label="Guardar cambio"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-7 w-7 shrink-0"
            disabled={busy}
            onClick={cancel}
            aria-label="Cancelar"
          >
            <X className="h-3 w-3" />
          </Button>
        </span>
        <span className="text-[11px] font-normal text-muted-foreground">
          {draft.length}/{maxLength}
        </span>
        {problem ? (
          <span role="alert" className="text-[11px] font-normal text-destructive">
            {problem}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="grid gap-0.5">
      <span className="flex items-start gap-2">
        <span className={className}>{children ?? value}</span>
        <button
          type="button"
          aria-label={`Editar ${label}`}
          disabled={busy}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
          onClick={start}
        >
          <Pencil className="h-3 w-3" />
        </button>
      </span>
      {restorable ? (
        <button
          type="button"
          disabled={busy}
          className="justify-self-start text-[11px] font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
          onClick={() => void run(null, "No se ha podido restaurar el nombre.")}
        >
          Restaurar nombre original
        </button>
      ) : null}
      {problem ? (
        <span role="alert" className="text-[11px] font-normal text-destructive">
          {problem}
        </span>
      ) : null}
    </span>
  );
}
