import "server-only";

import { forwardResponse, staffFetch } from "@/lib/staff-api";

export const IMAGE_KINDS = ["logo", "logoOnDark", "hero"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

/** The backend's own limit is 5 MB; the margin only absorbs framing so it can answer 413 itself. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

const TOO_LARGE = { code: "PAYLOAD_TOO_LARGE", message: "La imagen supera los 5 MB." };
const BAD_KIND = { code: "INVALID_IMAGE_KIND", message: "Tipo de imagen no válido." };

export const parseImageKind = (request: Request): ImageKind | null => {
  const kind = new URL(request.url).searchParams.get("kind");

  return IMAGE_KINDS.find((candidate) => candidate === kind) ?? null;
};

/**
 * Forwards an image upload to the backend as the raw bytes it was sent, with the original
 * Content-Type (the backend takes the bytes as the body, not multipart). Callers have already
 * authorized the request and built `backendPath` from the session, never from the request.
 * `kind` is re-validated here and rebuilt into the query string, so nothing else the browser
 * put in the query string reaches the backend.
 */
export const forwardImageUpload = async (request: Request, backendPath: string): Promise<Response> => {
  const kind = parseImageKind(request);

  if (!kind) {
    return Response.json(BAD_KIND, { status: 422 });
  }

  // Refuse before reading when the declared length already says it is too big.
  const declared = Number(request.headers.get("content-length"));

  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return Response.json(TOO_LARGE, { status: 413 });
  }

  const bytes = await request.arrayBuffer();

  // Content-Length can be absent (chunked) or wrong, so the real length is checked too.
  if (bytes.byteLength > MAX_BODY_BYTES) {
    return Response.json(TOO_LARGE, { status: 413 });
  }

  return forwardResponse(
    await staffFetch(`${backendPath}?kind=${kind}`, {
      method: "POST",
      body: bytes,
      // staffFetch defaults to JSON; an upload must carry the file's own type instead.
      headers: { "Content-Type": request.headers.get("content-type") ?? "application/octet-stream" },
    }),
  );
};
