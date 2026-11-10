import type {
  ChangeRequestStatus,
  ChangeRequestType,
} from "./staff-change-requests.ts";

/**
 * How a change request reads to the centre: Spanish labels and a plain-language summary of the
 * proposed values. Pure, so the wording is tested; the pages only lay it out.
 */

export const TYPE_LABELS: Record<ChangeRequestType, string> = {
  REWARD: "Recompensa",
  LEVEL: "Nivel",
  SERVICE_EDIT: "Cambio de servicio",
  SERVICE_ADD: "Nuevo servicio",
  SERVICE_REMOVE: "Baja de servicio",
  BONO: "Bono",
  OTHER: "Otro",
};

export const STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  REJECTED: "Rechazada",
};

export const isClosed = (status: ChangeRequestStatus): boolean =>
  status === "RESOLVED" || status === "REJECTED";

const wholeFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const centsFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "60 €" for whole euros, "65,50 €" with cents: a price as written in Spain. */
export const formatRequestEuros = (value: number): string =>
  `${(Number.isInteger(value) ? wholeFormat : centsFormat).format(value)} €`;

const capitalise = (text: string): string =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

export interface SummaryLine {
  label: string;
  value: string;
}

interface Describable {
  type: ChangeRequestType;
  targetRef: Record<string, unknown> | null;
  proposed: Record<string, unknown> | null;
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const sessionsText = (count: number): string =>
  `${count} ${count === 1 ? "sesión" : "sesiones"}`;

/** The Prize (Y/N) answer of a treatment request: "Sí" or "No", nothing when it was not asked. */
const prizeText = (value: unknown): string | null =>
  typeof value === "boolean" ? (value ? "Sí" : "No") : null;

/**
 * The request's proposed values in plain Spanish, one line each. `categoryLabel` turns a
 * category id into its name when the caller has the list; without it the id is not shown,
 * since it means nothing to the reader.
 */
export const describeRequest = (
  request: Describable,
  categoryLabel: (id: string) => string | undefined = () => undefined,
): SummaryLine[] => {
  const proposed = request.proposed ?? {};
  const target = request.targetRef ?? {};
  const lines: SummaryLine[] = [];
  const add = (label: string, value: string | null) => {
    if (value) lines.push({ label, value });
  };
  const price = num(proposed.priceEuro);
  const category = text(proposed.categoryId);
  const categoryName = category ? (categoryLabel(category) ?? null) : null;

  switch (request.type) {
    case "SERVICE_EDIT":
      add("Nombre nuevo", text(proposed.name));
      add("Precio nuevo", price === null ? null : formatRequestEuros(price));
      add("Categoría nueva", categoryName);
      add("Premio", prizeText(proposed.prize));
      break;
    case "SERVICE_ADD":
      add("Nombre", text(proposed.name));
      add("Precio", price === null ? null : formatRequestEuros(price));
      add("Categoría", categoryName);
      add("Premio", prizeText(proposed.prize));
      break;
    case "SERVICE_REMOVE":
      add("Qué pides", "Dar de baja este servicio");
      break;
    case "BONO": {
      const sessions = num(proposed.totalSessions);

      if (proposed.action === "add") {
        add("Qué pides", "Añadir un bono nuevo");
        add("Nombre", text(proposed.name));
        add("Precio del bono", price === null ? null : formatRequestEuros(price));
        add("Sesiones", sessions === null ? null : sessionsText(sessions));
      } else if (proposed.action === "edit") {
        add("Qué pides", "Cambiar un bono");
        add("Nombre nuevo", text(proposed.name));
        add(
          "Precio nuevo del bono",
          price === null ? null : formatRequestEuros(price),
        );
        add("Sesiones nuevas", sessions === null ? null : sessionsText(sessions));
      } else if (proposed.action === "remove") {
        add("Qué pides", "Dar de baja este bono");
      }
      break;
    }
    case "REWARD": {
      const milestone = num(target.milestone);

      add("Hito", milestone === null ? null : `Hito ${milestone}`);
      add("Premio propuesto", text(proposed.text));
      add(
        "Artículo del catálogo",
        text(proposed.itemId) ? "Has sugerido un artículo del catálogo" : null,
      );
      break;
    }
    case "LEVEL": {
      const tier = text(target.tier);

      add("Nivel", tier ? capitalise(tier) : null);
      add("Propuesta", text(proposed.text));
      break;
    }
    case "OTHER":
      break;
  }

  return lines;
};

/**
 * Whether a closed request may still be reopened: the backend's `reopenableUntil` is in the
 * future. It is null for an open request and once the 14 days are over.
 */
export const isReopenable = (
  request: { status: ChangeRequestStatus; reopenableUntil: string | null },
  now: number = Date.now(),
): boolean => {
  if (!isClosed(request.status) || !request.reopenableUntil) return false;

  const until = Date.parse(request.reopenableUntil);

  return Number.isFinite(until) && until > now;
};

/** Whether the thread takes a reply: always while open, and on a closed one only inside its window. */
export const canReply = (
  request: { status: ChangeRequestStatus; reopenableUntil: string | null },
  now: number = Date.now(),
): boolean => !isClosed(request.status) || isReopenable(request, now);

/** The latest sign of life on a request, as an ISO string. */
export const lastActivity = (request: {
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
}): string => {
  const candidates = [request.createdAt, request.updatedAt, request.lastMessageAt]
    .filter((value): value is string => typeof value === "string")
    .filter((value) => Number.isFinite(Date.parse(value)));

  return candidates.reduce((latest, value) =>
    Date.parse(value) > Date.parse(latest) ? value : latest,
  );
};

/** "31 oct 2026", in Spanish. `timeZone` is for tests; the screen uses the visitor's own. */
export const formatRequestDate = (iso: string, timeZone?: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
};
