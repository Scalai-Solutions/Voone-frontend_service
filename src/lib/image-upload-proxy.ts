import "server-only";

import { forwardResponse, staffFetch } from "@/lib/staff-api";

export const IMAGE_KINDS = ["logo", "logoOnDark", "hero"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

/** The backend's own limit is 5 MB; the margin only absorbs framing so it can answer 413 itself. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

const TOO_LARGE = { code: "IMAGE_TOO_LARGE", message: "La imagen supera los 5 MB." };
const BAD_KIND = { code: "IMAGE_KIND_INVALID", message: "Tipo de imagen no válido." };
const BAD_MEDIA_TYPE = { code: "IMAGE_MEDIA_TYPE", message: "Sube una imagen PNG, JPG o WebP." };
const STORAGE_FAILED = {
  code: "IMAGE_STORAGE_FAILED",
  message: "No se ha podido guardar la imagen. Inténtalo de nuevo.",
};

const ACCEPTED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const parseImageKind = (request: Request): ImageKind | null => {
  const kind = new URL(request.url).searchParams.get("kind");

  return IMAGE_KINDS.find((candidate) => candidate === kind) ?? null;
};

/**
 * Reads the body, stopping as soon as it passes `limit` bytes. Returns null when it does, after
 * cancelling the stream, so a chunked upload with no Content-Length cannot be buffered in full.
 */
const readBounded = async (request: Request, limit: number): Promise<Uint8Array | null> => {
  if (!request.body) {
    return new Uint8Array(0);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > limit) {
      await reader.cancel().catch(() => undefined);
      return null;
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
};

/**
 * Forwards an image upload to the backend as the raw bytes it was sent (the backend takes the
 * bytes as the body, not multipart). Callers have already authorized the request and built
 * `backendPath` from the session, never from the request. `kind` and the media type are
 * validated here and rebuilt, so nothing else the browser sent reaches the backend.
 */
export const forwardImageUpload = async (request: Request, backendPath: string): Promise<Response> => {
  const kind = parseImageKind(request);

  if (!kind) {
    return Response.json(BAD_KIND, { status: 422 });
  }

  // "image/png; charset=x" and "IMAGE/PNG" are the same type; only the bare value is forwarded.
  const mediaType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();

  if (!ACCEPTED_MEDIA_TYPES.includes(mediaType)) {
    return Response.json(BAD_MEDIA_TYPE, { status: 415 });
  }

  // Fast path: refuse before reading when the declared length already says it is too big.
  const declared = Number(request.headers.get("content-length"));

  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return Response.json(TOO_LARGE, { status: 413 });
  }

  // Content-Length can be absent (chunked) or wrong, so the bytes are counted as they arrive.
  const bytes = await readBounded(request, MAX_BODY_BYTES);

  if (!bytes) {
    return Response.json(TOO_LARGE, { status: 413 });
  }

  try {
    return forwardResponse(
      await staffFetch(`${backendPath}?kind=${kind}`, {
        method: "POST",
        body: bytes as BodyInit,
        // Spelled exactly "Content-Type" so it overrides staffFetch's JSON default (header
        // names are matched as written when staffFetch spreads these over its own).
        headers: { "Content-Type": mediaType },
      }),
    );
  } catch {
    // The backend could not be reached: the same answer as a storage failure, and nothing
    // about the network error is exposed.
    return Response.json(STORAGE_FAILED, { status: 502 });
  }
};
