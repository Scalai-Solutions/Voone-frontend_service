"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ApiError, uploadImage, type ImageUploadKind } from "@/lib/api-client";
import { IMAGE_UPLOAD_HINTS } from "@/lib/image-upload-hints";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export interface ImageUploadLabels {
  button: string;
  uploading: string;
  hint: string;
  invalidType: string;
  tooLarge: string;
  failed: string;
  /** Appended to the backend's message when uploads are not configured. */
  pasteUrl: string;
  /** Field-specific accessible name for the button, e.g. "Subir imagen del logo". */
  ariaLabel?: string;
  /**
   * Replaces the backend's message for an `IMAGE_*` error code. The backend speaks Spanish,
   * so by default (null) its own message is shown.
   */
  serverMessages: Partial<Record<string, string>> | null;
}

/** The backend's code when uploads are not configured; its Spanish message has no "paste a URL" hint. */
const STORAGE_UNCONFIGURED = "IMAGE_STORAGE_UNCONFIGURED";

/** Spanish by default: the clinic dashboard and the admin activation flow are Spanish. */
export const SPANISH_UPLOAD_LABELS: ImageUploadLabels = {
  button: "Subir imagen",
  uploading: "Subiendo...",
  hint: "Solo PNG, JPG o WebP de hasta 5 MB.",
  invalidType: "Sube una imagen PNG, JPG o WebP.",
  tooLarge: "La imagen supera los 5 MB.",
  failed: "No se ha podido subir la imagen. Inténtalo de nuevo.",
  pasteUrl: "Pega una URL en su lugar.",
  serverMessages: null,
};

/**
 * What to show for a failed upload. Only the backend's `IMAGE_*` errors carry copy meant for
 * the user; anything else (a guard's "Forbidden", a 500, a network error) gets the generic
 * label rather than whatever English text it came with.
 */
const describeError = (caught: unknown, text: ImageUploadLabels): string => {
  if (!(caught instanceof ApiError) || !caught.code?.startsWith("IMAGE_")) {
    return text.failed;
  }

  const mapped = text.serverMessages?.[caught.code];

  if (mapped) {
    return mapped;
  }

  const message = caught.detail || text.failed;

  return caught.code === STORAGE_UNCONFIGURED
    ? `${message} ${text.pasteUrl}`
    : message;
};

/**
 * A button that uploads a file and hands back its public URL. The URL field next to it stays,
 * so a pasted link keeps working. The type and size are checked here to save a round trip; the
 * backend checks them again.
 */
export function ImageUploadButton({
  kind,
  scope,
  onUploaded,
  labels,
  disabled,
}: {
  kind: ImageUploadKind;
  scope: "clinic" | "admin";
  onUploaded: (url: string) => void;
  labels?: Partial<ImageUploadLabels>;
  disabled?: boolean;
}) {
  // The hint is per kind (sizes differ for a logo and a hero image) unless a caller words its own.
  const text: ImageUploadLabels = {
    ...SPANISH_UPLOAD_LABELS,
    hint: IMAGE_UPLOAD_HINTS[kind],
    ...labels,
  };
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];

    // Cleared so choosing the same file again fires another change event.
    const reset = () => {
      input.value = "";
    };

    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(text.invalidType);
      reset();
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(text.tooLarge);
      reset();
      return;
    }

    setError(null);
    setWarnings([]);
    setUploading(true);

    try {
      const { url, warnings: advice } = await uploadImage(file, kind, scope);

      onUploaded(url);
      setWarnings(advice);
    } catch (caught) {
      setError(describeError(caught, text));
    } finally {
      setUploading(false);
      reset();
    }
  };

  return (
    <div className="mt-2 min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={uploading ? undefined : text.ariaLabel}
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? text.uploading : text.button}
        </Button>
        <span className="text-xs text-[#927e72]">{text.hint}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        tabIndex={-1}
        onChange={handleChange}
      />
      {error ? (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {warnings.length > 0 ? (
        <ul
          role="status"
          className="mt-1 list-disc space-y-1 rounded-lg bg-[#fff8ec] py-2 pl-6 pr-3 text-xs leading-5 text-[#806d63]"
        >
          <li className="list-none font-semibold text-[#6f4d3f] -ml-4">
            Imagen subida, pero se puede mejorar:
          </li>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
