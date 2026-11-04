"use client";

import * as React from "react";

import { NAME_VARIABLE } from "@/features/notifications/personalise";

/** Puts {first_name} where the cursor is in a field, so the message greets each member by name. */
export function InsertNameButton({
  fieldRef,
  value,
  maxLength,
  onChange,
}: {
  fieldRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  maxLength: number;
  onChange: (next: string) => void;
}) {
  const insert = () => {
    const field = fieldRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = (
      value.slice(0, start) +
      NAME_VARIABLE +
      value.slice(end)
    ).slice(0, maxLength);

    onChange(next);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(
        start + NAME_VARIABLE.length,
        start + NAME_VARIABLE.length,
      );
    });
  };

  return (
    <button
      type="button"
      onClick={insert}
      className="mt-2 rounded-full border border-[#ded1c8] bg-white px-3 py-1 text-xs font-semibold text-[#6f4d3f] hover:bg-[#f7efe8]"
    >
      Insertar nombre del cliente
    </button>
  );
}
