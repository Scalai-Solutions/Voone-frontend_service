import {
  CHANGE_REQUEST_STATUSES,
  isChangeRequestStatus,
  isChangeRequestType,
  type ChangeRequestStatus,
} from "./admin-change-requests.ts";

/**
 * Validation of what the admin proxy forwards to the backend.
 *
 * The backend validates too (and answers 422 to any unknown key), but the proxy builds a
 * fresh object holding ONLY the fields it knows, so the browser cannot smuggle anything
 * extra through a shared-key call, and a malformed request fails here with a plain
 * English message instead of reaching the backend. The backend's own errors still pass
 * through unchanged.
 */

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

const ok = <T>(value: T): Parsed<T> => ({ ok: true, value });
const fail = (message: string): { ok: false; message: string } => ({
  ok: false,
  message,
});

export const NOTE_MAX = 2000;
export const MESSAGE_MAX = 2000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Parses a request body's text; an empty body is an empty object. */
export const parseJson = (text: string): Parsed<unknown> => {
  if (text.trim() === "") return ok({});

  try {
    return ok(JSON.parse(text) as unknown);
  } catch {
    return fail("The request body is not valid JSON.");
  }
};

const onlyKeys = (
  body: Record<string, unknown>,
  allowed: readonly string[],
): string | null => {
  const extra = Object.keys(body).find((key) => !allowed.includes(key));

  return extra ? `Unexpected field "${extra}".` : null;
};

/** Line breaks stay; other control characters go. Mirrors what the backend stores. */
const cleanText = (value: string): string =>
  value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "")
    .trim();

export const parseMessageBody = (raw: unknown): Parsed<{ body: string }> => {
  if (!isRecord(raw)) return fail("Send a JSON object with a message body.");

  const extra = onlyKeys(raw, ["body"]);
  if (extra) return fail(extra);

  if (typeof raw.body !== "string") return fail("Write a message.");

  const body = cleanText(raw.body);

  if (body.length < 1) return fail("Write a message.");
  if (body.length > MESSAGE_MAX)
    return fail(`A message can have up to ${MESSAGE_MAX} characters.`);

  return ok({ body });
};

export const parseStatusBody = (
  raw: unknown,
): Parsed<{ status: ChangeRequestStatus; resolutionNote?: string }> => {
  if (!isRecord(raw)) return fail("Send a JSON object with a status.");

  const extra = onlyKeys(raw, ["status", "resolutionNote"]);
  if (extra) return fail(extra);

  if (!isChangeRequestStatus(raw.status)) {
    return fail(`Status must be one of ${CHANGE_REQUEST_STATUSES.join(", ")}.`);
  }

  let note: string | undefined;

  if (raw.resolutionNote !== undefined && raw.resolutionNote !== null) {
    if (typeof raw.resolutionNote !== "string")
      return fail("The resolution note must be text.");

    note = cleanText(raw.resolutionNote);

    if (note.length > NOTE_MAX)
      return fail(`The note can have up to ${NOTE_MAX} characters.`);
  }

  if ((raw.status === "RESOLVED" || raw.status === "REJECTED") && !note) {
    return fail("A resolution note is required to resolve or reject a request.");
  }

  return ok({
    status: raw.status,
    ...(note ? { resolutionNote: note } : {}),
  });
};

export const parseApplyBody = (raw: unknown): Parsed<{ note?: string }> => {
  if (!isRecord(raw)) return fail("Send a JSON object.");

  const extra = onlyKeys(raw, ["note"]);
  if (extra) return fail(extra);

  if (raw.note === undefined || raw.note === null) return ok({});
  if (typeof raw.note !== "string") return fail("The note must be text.");

  const note = cleanText(raw.note);

  if (note.length > NOTE_MAX)
    return fail(`The note can have up to ${NOTE_MAX} characters.`);

  return ok(note ? { note } : {});
};

/** The note every ticket linked to a published programme is resolved with: required. */
export const parseResolveTicketsBody = (
  raw: unknown,
): Parsed<{ note: string }> => {
  if (!isRecord(raw)) return fail("Send a JSON object with a note.");

  const extra = onlyKeys(raw, ["note"]);
  if (extra) return fail(extra);

  if (typeof raw.note !== "string") return fail("A resolution note is required.");

  const note = cleanText(raw.note);

  if (!note) return fail("A resolution note is required.");
  if (note.length > NOTE_MAX)
    return fail(`The note can have up to ${NOTE_MAX} characters.`);

  return ok({ note });
};

/** The draft call carries nothing: the ticket id in the path says it all. */
export const parseDraftBody = (raw: unknown): Parsed<Record<string, never>> => {
  if (!isRecord(raw)) return fail("Send an empty JSON object.");
  if (Object.keys(raw).length > 0) return fail("This request takes no fields.");

  return ok({});
};

const CURSOR_PATTERN = /^[A-Za-z0-9_=-]{1,512}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * The list filters, as the query string to forward. Anything not named here is dropped, and
 * a value that is not valid is an error (a typo'd status silently listing everything would
 * show the wrong inbox).
 */
export const parseListQuery = (
  params: URLSearchParams,
): Parsed<URLSearchParams> => {
  const out = new URLSearchParams();

  const status = params.get("status");
  if (status) {
    if (!isChangeRequestStatus(status)) return fail("Unknown status filter.");
    out.set("status", status);
  }

  const type = params.get("type");
  if (type) {
    if (!isChangeRequestType(type)) return fail("Unknown type filter.");
    out.set("type", type);
  }

  const clinicId = params.get("clinicId");
  if (clinicId) {
    if (!ID_PATTERN.test(clinicId)) return fail("Invalid clinic filter.");
    out.set("clinicId", clinicId);
  }

  const q = params.get("q")?.trim();
  if (q) {
    if (q.length > 120) return fail("The search text is too long.");
    out.set("q", q);
  }

  const limit = params.get("limit");
  if (limit) {
    const n = Number(limit);

    if (!Number.isInteger(n) || n < 1 || n > 50)
      return fail("The limit must be a whole number from 1 to 50.");
    out.set("limit", String(n));
  }

  const cursor = params.get("cursor");
  if (cursor) {
    if (!CURSOR_PATTERN.test(cursor)) return fail("Invalid cursor.");
    out.set("cursor", cursor);
  }

  return ok(out);
};
