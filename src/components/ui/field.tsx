"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A labelled form row with an error slot.
 *
 * Extracted because this had been copy-pasted into four files, none of which associated
 * the label with its control — so tapping a label focused nothing and a screen reader
 * announced the two separately. By default the single child is cloned to receive a
 * generated id.
 *
 * Pass `htmlFor` when the child is a wrapper rather than the control itself, as with a
 * colour picker that holds a visible input and a hidden registered one: injecting an id
 * into the wrapper would point the label at an unfocusable `<div>`, which is worse than
 * leaving them unassociated.
 */
export function Field({
  label,
  error,
  hint,
  className,
  labelClassName,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  labelClassName?: string;
  /** Id of the real control, when the child is a wrapper. */
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const generatedId = React.useId();
  const controlId = htmlFor ?? generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  const control =
    !htmlFor && React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement<{
            id?: string;
            "aria-describedby"?: string;
            "aria-invalid"?: boolean;
          }>,
          {
            id: controlId,
            "aria-describedby": describedBy || undefined,
            "aria-invalid": error ? true : undefined,
          }
        )
      : children;

  return (
    <div className={className}>
      <Label htmlFor={controlId} className={cn("mb-2 block", labelClassName)}>
        {label}
      </Label>
      {control}
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {/* role="alert" so the message is announced when it appears after a failed submit. */}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
