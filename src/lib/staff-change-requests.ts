/**
 * Change requests ("solicitudes"): what a centre's owner or manager asks Voone to change
 * (rewards, levels, services, bonos), and the one parser of what a request may contain.
 *
 * Pure on purpose: no framework, no alias imports. The route handlers run `parseCreateRequest`
 * before anything reaches the backend, the form runs the same function before it sends, and
 * `npm test` covers it. The limits and the accepted shapes mirror the backend's strict schema
 * (Voone-backend_service, src/modules/change-requests/schema.ts), which stays the authority:
 * this exists so a bad body is refused here, in Spanish, instead of being forwarded, and so
 * the browser never sends a key the backend would refuse.
 */

export const CHANGE_REQUEST_TYPES = [
  "REWARD",
  "LEVEL",
  "SERVICE_EDIT",
  "SERVICE_ADD",
  "SERVICE_REMOVE",
  "BONO",
  "OTHER",
] as const;
export type ChangeRequestType = (typeof CHANGE_REQUEST_TYPES)[number];

export const CHANGE_REQUEST_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const TITLE_MAX = 120;
export const REASON_MIN = 3;
export const REASON_MAX = 2000;
export const MESSAGE_MAX = 2000;
/** The cap of the free text that rides in `proposed` (a reward or level wish). Longer goes in the reason. */
export const SHORT_TEXT_MAX = 120;
export const NAME_MAX = 120;
export const PRICE_MIN = 0.01;
export const PRICE_MAX = 100_000;
export const SESSIONS_MIN = 1;
export const SESSIONS_MAX = 100;
export const LIST_MAX_LIMIT = 50;

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export interface CreateChangeRequestBody {
  type: ChangeRequestType;
  title: string;
  reason: string;
  targetRef?: Record<string, unknown>;
  proposed?: Record<string, unknown>;
}

/* ---- text cleaning, as the backend does it ---- */

const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
// Everything except tab and line feed, which a written explanation legitimately has.
const CONTROL_KEEPING_BREAKS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

const oneLine = (value: string): string =>
  value.replace(/[\r\n\t]+/g, " ").replace(CONTROL, "").trim();

const manyLines = (value: string): string =>
  value.replace(/\r\n?/g, "\n").replace(CONTROL_KEEPING_BREAKS, "").trim();

/* ---- parse machinery ---- */

class Refusal extends Error {}

const refuse = (message: string): never => {
  throw new Refusal(message);
};

const guarded = <T>(run: () => T): ParseResult<T> => {
  try {
    return { ok: true, value: run() };
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, message: error.message };
    throw error;
  }
};

const UNKNOWN_FIELDS = "La solicitud contiene datos que no se pueden procesar.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** An object whose keys are all in `allowed`; anything else is refused, never dropped. */
const strictObject = (
  value: unknown,
  allowed: readonly string[],
  message = UNKNOWN_FIELDS,
): Record<string, unknown> => {
  if (!isRecord(value)) return refuse(message);

  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) refuse(UNKNOWN_FIELDS);
  }

  return value;
};

const readLine = (
  value: unknown,
  min: number,
  max: number,
  message: string,
): string => {
  if (typeof value !== "string") return refuse(message);

  const text = oneLine(value);

  return text.length >= min && text.length <= max ? text : refuse(message);
};

const readLines = (
  value: unknown,
  min: number,
  max: number,
  message: string,
): string => {
  if (typeof value !== "string") return refuse(message);

  const text = manyLines(value);

  return text.length >= min && text.length <= max ? text : refuse(message);
};

const readId = (value: unknown): string =>
  readLine(value, 1, 64, "Identificador no válido.");

const readMilestone = (value: unknown): number => {
  const message = "Indica un número de hito válido.";

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 1000
    ? value
    : refuse(message);
};

const PRICE_MESSAGE = "El precio debe estar entre 0,01 € y 100.000 €.";
const DECIMALS_MESSAGE = "El precio admite como máximo dos decimales.";

const readPrice = (value: unknown): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < PRICE_MIN ||
    value > PRICE_MAX
  ) {
    return refuse(PRICE_MESSAGE);
  }

  if (Math.abs(value * 100 - Math.round(value * 100)) >= 1e-7) {
    refuse(DECIMALS_MESSAGE);
  }

  return value;
};

const readSessions = (value: unknown): number => {
  const message = `El bono tiene entre ${SESSIONS_MIN} y ${SESSIONS_MAX} sesiones.`;

  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= SESSIONS_MIN &&
    value <= SESSIONS_MAX
    ? value
    : refuse(message);
};

const readName = (value: unknown, message: string): string =>
  readLine(value, 1, NAME_MAX, message);

const readCategory = (value: unknown): string =>
  readLine(value, 1, 32, "Elige una categoría de la lista.");

const readShortText = (value: unknown): string =>
  readLine(
    value,
    1,
    SHORT_TEXT_MAX,
    `El texto debe tener entre 1 y ${SHORT_TEXT_MAX} caracteres.`,
  );

const readTier = (value: unknown): string =>
  readLine(value, 1, 32, "Indica un nivel válido.");

const NOTHING_TO_CHANGE = "Indica al menos un cambio concreto.";

/** A part with only the keys that were given: an absent key is absent, not undefined. */
const pick = (
  source: Record<string, unknown>,
  readers: Record<string, (value: unknown) => unknown>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, read] of Object.entries(readers)) {
    if (source[key] !== undefined) out[key] = read(source[key]);
  }

  return out;
};

const requireOneOf = (part: Record<string, unknown>, keys: string[]) => {
  if (!keys.some((key) => part[key] !== undefined)) refuse(NOTHING_TO_CHANGE);
};

type PartReader = (raw: unknown) => Record<string, unknown>;

const object =
  (
    keys: readonly string[],
    readers: Record<string, (value: unknown) => unknown>,
    required: readonly string[] = [],
    atLeastOne?: string[],
  ): PartReader =>
  (raw) => {
    const source = strictObject(raw, keys);

    for (const key of required) {
      if (source[key] === undefined) {
        // The same wording the backend gives for a missing structured value.
        refuse(
          key === "bonoId" || key === "treatmentId"
            ? "Indica sobre qué elemento quieres el cambio."
            : "Indica los datos del cambio que propones.",
        );
      }
    }

    const part = pick(source, readers);

    if (atLeastOne) requireOneOf(part, atLeastOne);

    return part;
  };

const rewardTarget = object(["milestone"], { milestone: readMilestone }, ["milestone"]);
const rewardProposed = object(["milestone", "text", "itemId"], {
  milestone: readMilestone,
  text: readShortText,
  itemId: readId,
});

const levelTarget = object(["tier"], { tier: readTier }, ["tier"]);
const levelProposed = object(["tier", "text"], {
  tier: readTier,
  text: readShortText,
});

const treatmentTarget = object(["treatmentId"], { treatmentId: readId }, [
  "treatmentId",
]);
/** The Prize (Y/N) answer: a plain yes or no, nothing else. */
const readPrize = (value: unknown): boolean =>
  typeof value === "boolean" ? value : refuse(UNKNOWN_FIELDS);

const serviceEditProposed = object(
  ["treatmentId", "name", "priceEuro", "categoryId", "prize"],
  {
    treatmentId: readId,
    name: (v) => readName(v, "Escribe el nombre del tratamiento."),
    priceEuro: readPrice,
    categoryId: readCategory,
    prize: readPrize,
  },
  [],
  ["name", "priceEuro", "categoryId", "prize"],
);
const serviceAddProposed = object(
  ["name", "priceEuro", "categoryId", "prize"],
  {
    name: (v) => readName(v, "Escribe el nombre del tratamiento."),
    priceEuro: readPrice,
    categoryId: readCategory,
    prize: readPrize,
  },
  ["name", "priceEuro"],
);
const serviceRemoveProposed = object(["treatmentId"], {
  treatmentId: readId,
});

const bonoTarget = object(["bonoId"], { bonoId: readId }, ["bonoId"]);

const bonoName = (v: unknown) => readName(v, "Escribe el nombre del bono.");

const bonoProposed: PartReader = (raw) => {
  if (!isRecord(raw)) return refuse(UNKNOWN_FIELDS);

  const action = raw.action;

  if (action === "add") {
    const part = object(
      ["action", "name", "priceEuro", "totalSessions"],
      { name: bonoName, priceEuro: readPrice, totalSessions: readSessions },
      ["name", "priceEuro", "totalSessions"],
    )(raw);

    return { action, ...part };
  }

  if (action === "edit") {
    const part = object(
      ["action", "bonoId", "name", "priceEuro", "totalSessions"],
      {
        bonoId: readId,
        name: bonoName,
        priceEuro: readPrice,
        totalSessions: readSessions,
      },
      [],
      ["name", "priceEuro", "totalSessions"],
    )(raw);

    return { action, ...part };
  }

  if (action === "remove") {
    const part = object(["action", "bonoId"], { bonoId: readId })(raw);

    return { action, ...part };
  }

  return refuse("Indica si quieres añadir, editar o quitar un bono.");
};

interface TypeRule {
  target?: PartReader;
  targetRequired?: (proposed: Record<string, unknown> | undefined) => boolean;
  proposed: PartReader;
  proposedRequired?: boolean;
}

const nothing: PartReader = object([], {});

const RULES: Record<ChangeRequestType, TypeRule> = {
  REWARD: { target: rewardTarget, proposed: rewardProposed },
  LEVEL: { target: levelTarget, proposed: levelProposed },
  SERVICE_EDIT: {
    target: treatmentTarget,
    targetRequired: () => true,
    proposed: serviceEditProposed,
    proposedRequired: true,
  },
  SERVICE_ADD: { proposed: serviceAddProposed, proposedRequired: true },
  SERVICE_REMOVE: {
    target: treatmentTarget,
    targetRequired: () => true,
    proposed: serviceRemoveProposed,
  },
  BONO: {
    target: bonoTarget,
    targetRequired: (proposed) =>
      proposed?.action === "edit" || proposed?.action === "remove",
    proposed: bonoProposed,
  },
  OTHER: { proposed: nothing },
};

const isEmpty = (part: Record<string, unknown>) => Object.keys(part).length === 0;

const readPart = (
  reader: PartReader | undefined,
  raw: unknown,
): Record<string, unknown> | undefined => {
  if (raw === undefined || raw === null) return undefined;

  if (!reader) {
    return refuse("Este tipo de solicitud no admite un elemento de referencia.");
  }

  const part = reader(raw);

  return isEmpty(part) ? undefined : part;
};

/**
 * The `targetRef` and `proposed` of a request of `type`, cleaned and checked against the shape
 * of that type, with the cross-checks between them. Shared by the ticket and the what-if.
 */
const readParts = (
  type: ChangeRequestType,
  source: Record<string, unknown>,
): { targetRef?: Record<string, unknown>; proposed?: Record<string, unknown> } => {
  const rule = RULES[type];
  const targetRef = readPart(rule.target, source.targetRef);
  const proposed = readPart(rule.proposed, source.proposed);

  if (rule.proposedRequired && source.proposed == null) {
    refuse("Indica los datos del cambio que propones.");
  }

  if (rule.targetRequired?.(proposed) && targetRef === undefined) {
    refuse("Indica sobre qué elemento quieres el cambio.");
  }

  if (targetRef && proposed) {
    for (const key of Object.keys(targetRef)) {
      if (key in proposed && proposed[key] !== targetRef[key]) {
        refuse("Los datos propuestos no coinciden con el elemento indicado.");
      }
    }
  }

  if (proposed?.action === "add" && targetRef) {
    refuse("Un bono nuevo no tiene un bono de referencia.");
  }

  return {
    ...(targetRef ? { targetRef } : {}),
    ...(proposed ? { proposed } : {}),
  };
};

/**
 * A new ticket, cleaned and checked. `targetRef` says what the request is about and `proposed`
 * what the centre would like instead; both follow the shape of the type. Returns the body to
 * forward, with only the keys the backend accepts, or the first problem in Spanish.
 */
export const parseCreateRequest = (
  input: unknown,
): ParseResult<CreateChangeRequestBody> =>
  guarded(() => {
    const source = strictObject(input, [
      "type",
      "title",
      "reason",
      "targetRef",
      "proposed",
    ]);
    const type = CHANGE_REQUEST_TYPES.find((t) => t === source.type);

    if (!type) return refuse("Elige un tipo de solicitud válido.");

    const title = readLine(
      source.title,
      1,
      TITLE_MAX,
      `Escribe un título de hasta ${TITLE_MAX} caracteres.`,
    );
    const reason = readLines(
      source.reason,
      REASON_MIN,
      REASON_MAX,
      `Explica el motivo de la solicitud (entre ${REASON_MIN} y ${REASON_MAX} caracteres).`,
    );

    return { type, title, reason, ...readParts(type, source) };
  });

/** The two ticket types the what-if can simulate. */
export const PREVIEW_TYPES = ["REWARD", "SERVICE_EDIT"] as const;
export type PreviewType = (typeof PREVIEW_TYPES)[number];

export interface PreviewRequestBody {
  type: PreviewType;
  targetRef?: Record<string, unknown>;
  proposed?: Record<string, unknown>;
}

/**
 * The owner's what-if: a reward or a price edit, with the very same `targetRef` / `proposed`
 * shapes as a ticket, no title or reason, and never a clinic (it comes from the session).
 */
export const parsePreviewRequest = (
  input: unknown,
): ParseResult<PreviewRequestBody> =>
  guarded(() => {
    const source = strictObject(input, ["type", "targetRef", "proposed"]);
    const type = PREVIEW_TYPES.find((t) => t === source.type);

    if (!type) {
      return refuse("Solo se puede simular un premio o el precio de un servicio.");
    }

    return { type, ...readParts(type, source) };
  });

const MESSAGE_ERROR = `Escribe un mensaje de hasta ${MESSAGE_MAX} caracteres.`;

/** A reply in a thread: `{ body }`, nothing else. */
export const parseMessageBody = (
  input: unknown,
): ParseResult<{ body: string }> =>
  guarded(() => {
    const source = strictObject(input, ["body"]);

    return { body: readLines(source.body, 1, MESSAGE_MAX, MESSAGE_ERROR) };
  });

/** Reopening may carry a word of explanation; the body may be missing or empty. */
export const parseReopenBody = (
  input: unknown,
): ParseResult<{ message?: string }> =>
  guarded(() => {
    if (input === undefined || input === null) return {};

    const source = strictObject(input, ["message"]);

    if (source.message === undefined || source.message === null) return {};

    return { message: readLines(source.message, 1, MESSAGE_MAX, MESSAGE_ERROR) };
  });

/** Ids in the URL: opaque ids only. "." and ".." would collapse the path once the URL is parsed. */
export const isValidRequestId = (id: string): boolean =>
  /^[A-Za-z0-9_-]{1,64}$/.test(id);

export interface ListQuery {
  status?: ChangeRequestStatus;
  limit?: number;
  cursor?: string;
}

/**
 * The list's query: only `status`, `limit` and `cursor` survive, each checked. Anything else in
 * the URL is ignored rather than forwarded.
 */
export const parseListQuery = (params: URLSearchParams): ParseResult<ListQuery> =>
  guarded(() => {
    const query: ListQuery = {};
    const status = params.get("status");
    const limit = params.get("limit");
    const cursor = params.get("cursor");

    if (status) {
      const known = CHANGE_REQUEST_STATUSES.find((s) => s === status);

      if (!known) refuse("Estado no válido.");
      query.status = known;
    }

    if (limit) {
      const value = Number(limit);

      if (!/^\d{1,3}$/.test(limit) || value < 1 || value > LIST_MAX_LIMIT) {
        refuse(`El límite debe estar entre 1 y ${LIST_MAX_LIMIT}.`);
      }
      query.limit = value;
    }

    if (cursor) {
      if (cursor.length > 200 || !/^[A-Za-z0-9_=-]+$/.test(cursor)) {
        refuse("El cursor de paginación no es válido.");
      }
      query.cursor = cursor;
    }

    return query;
  });

/** `?status=OPEN&limit=20`, or "" for no filters. */
export const listQueryString = (query: ListQuery): string => {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);

  const text = params.toString();

  return text ? `?${text}` : "";
};
