"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ApiError, uploadImage, type ImageUploadKind } from "@/lib/api-client";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export interface ImageUploadLabels {
  button: string;
  uploading: string;
  hint: string;
  invalidType: string;
  tooLarge: string;
  failed: string;
  /** Appended when the backend says uploads are not configured (503). */
  pasteUrl: string;
}

/** Spanish by default: everything a clinic user sees is Spanish. The admin wizard passes English. */
export const SPANISH_UPLOAD_LABELS: ImageUploadLabels = {
  button: "Subir imagen",
  uploading: "Subiendo...",
  hint: "Solo PNG, JPG o WebP de hasta 5 MB.",
  invalidType: "Sube una imagen PNG, JPG o WebP.",
  tooLarge: "La imagen supera los 5 MB.",
  failed: "No se ha podido subir la imagen. Inténtalo de nuevo.",
  pasteUrl: "Pega una URL en su lugar.",
};

export const ENGLISH_UPLOAD_LABELS: ImageUploadLabels = {
  button: "Upload image",
  uploading: "Uploading...",
  hint: "PNG, JPG or WebP only, up to 5 MB.",
  invalidType: "Upload a PNG, JPG or WebP image.",
  tooLarge: "The image is larger than 5 MB.",
  failed: "The image could not be uploaded. Try again.",
  pasteUrl: "Paste a URL instead.",
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
  const text = { ...SPANISH_UPLOAD_LABELS, ...labels };
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    setUploading(true);

    try {
      const { url } = await uploadImage(file, kind, scope);

      onUploaded(url);
    } catch (caught) {
      const message = caught instanceof ApiError && caught.detail ? caught.detail : text.failed;

      setError(caught instanceof ApiError && caught.status === 503 ? `${message} ${text.pasteUrl}` : message);
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
    </div>
  );
}
