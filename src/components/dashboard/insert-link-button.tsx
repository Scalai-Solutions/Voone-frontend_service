"use client";

import * as React from "react";

import { parseLink } from "@/lib/parse-link";

import { insertAtCursor } from "./insert-name-button";

/**
 * Asks for an address and puts it where the cursor is in the message. The backend turns it into a
 * tappable link on Google Wallet. A link that does not fit is refused, never cut: half a URL is a
 * broken link on every phone.
 */
export function InsertLinkButton({
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
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputId = React.useId();

  const insert = () => {
    const link = parseLink(url);

    if (!link) {
      setError("Escribe una dirección completa que empiece por https://");
      return;
    }

    const cursor = fieldRef.current?.selectionStart ?? value.length;
    const before = cursor > 0 && !/\s/.test(value[cursor - 1]) ? " " : "";
    const text = `${before}${link} `;
    const selected = (fieldRef.current?.selectionEnd ?? cursor) - cursor;

    if (value.length - selected + text.trimEnd().length > maxLength) {
      setError(`El enlace no cabe: quedan ${maxLength - value.length + selected} caracteres.`);
      return;
    }

    insertAtCursor(fieldRef, value, text, maxLength, onChange);
    setUrl("");
    setError(null);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-full border border-[#ded1c8] bg-white px-3 py-1 text-xs font-semibold text-[#6f4d3f] hover:bg-[#f7efe8]"
      >
        Insertar enlace
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[#ded1c8] bg-white p-3">
      <label htmlFor={inputId} className="block text-xs font-semibold">
        Dirección del enlace
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoFocus
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              insert();
            }
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="https://tucentro.com/reservar"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="min-w-0 flex-1 rounded-lg border border-[#ded1c8] px-2 py-1.5 text-sm font-normal outline-none focus:border-[#b8864b]"
        />
        <button
          type="button"
          onClick={insert}
          className="rounded-full bg-[#b8864b] px-3 py-1 text-xs font-semibold text-white"
        >
          Insertar
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-full px-2 py-1 text-xs font-semibold text-[#806d63]"
        >
          Cancelar
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-[#8f3f35]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
