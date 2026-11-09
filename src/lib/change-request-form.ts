import {
  NAME_MAX,
  PRICE_MAX,
  PRICE_MIN,
  REASON_MAX,
  REASON_MIN,
  SESSIONS_MAX,
  SESSIONS_MIN,
  SHORT_TEXT_MAX,
  TITLE_MAX,
  parseCreateRequest,
  type CreateChangeRequestBody,
} from "./staff-change-requests.ts";
import { parsePrice, priceToText } from "./treatment-price.ts";

/**
 * The change-request form, as pure functions: what each kind of request starts from, and how
 * the typed values become the body the proxy accepts. The panel only renders and calls these,
 * so the validation (the backend's limits, in Spanish) is tested without a DOM.
 */

export interface TreatmentRef {
  id: string;
  name: string;
  priceEuro: number | null;
  categoryId: string | null;
}

export interface BonoRef {
  id: string;
  name: string;
  /** What the whole pack costs. */
  totalEuro: number;
  totalSessions: number;
}

export type RequestContext =
  | { kind: "service-edit"; treatment: TreatmentRef; usesCatalogue: boolean }
  | { kind: "service-add"; usesCatalogue: boolean }
  | { kind: "service-remove"; treatment: TreatmentRef }
  | { kind: "bono-add" }
  | { kind: "bono-edit"; plan: BonoRef }
  | { kind: "bono-remove"; plan: BonoRef }
  | { kind: "reward"; milestone?: number; label?: string; detail?: string }
  | { kind: "level"; tier?: string; label?: string; detail?: string }
  /** `title` pre-fills the editable title; `label`/`detail` name what it is about (a referral step). */
  | { kind: "other"; title?: string; label?: string; detail?: string };

/** A reward request names a catalogue item, or describes the wish in words. */
export type RewardMode = "item" | "text";

export interface FormValues {
  name: string;
  price: string;
  categoryId: string;
  sessions: string;
  text: string;
  /** The catalogue item a reward request proposes (its externalId); used in `item` mode. */
  itemId: string;
  rewardMode: RewardMode;
  title: string;
  reason: string;
  confirm: boolean;
}

export type FormField = keyof FormValues | "form";
export type FormErrors = Partial<Record<FormField, string>>;

export type BuildResult =
  | { ok: true; body: CreateChangeRequestBody }
  | { ok: false; errors: FormErrors };

/** The values a form opens with: the current ones for an edit, so only what changes is retyped. */
export const initialValues = (context: RequestContext): FormValues => {
  const empty: FormValues = {
    name: "",
    price: "",
    categoryId: "",
    sessions: "",
    text: "",
    itemId: "",
    rewardMode: "item",
    title: "",
    reason: "",
    confirm: false,
  };

  if (context.kind === "service-edit") {
    return {
      ...empty,
      name: context.treatment.name,
      price: priceToText(context.treatment.priceEuro),
      categoryId: context.treatment.categoryId ?? "",
    };
  }

  if (context.kind === "bono-edit") {
    return {
      ...empty,
      name: context.plan.name,
      price: priceToText(context.plan.totalEuro),
      sessions: String(context.plan.totalSessions),
    };
  }

  if (context.kind === "other" && context.title) {
    return { ...empty, title: clip(context.title) };
  }

  return empty;
};

/** Switches how a reward is described, clearing the field of the mode being left. */
export const withRewardMode = (values: FormValues, mode: RewardMode): FormValues => {
  if (values.rewardMode === mode) return values;

  return mode === "item"
    ? { ...values, rewardMode: mode, text: "" }
    : { ...values, rewardMode: mode, itemId: "" };
};

/** A title that fits the backend's limit: long names are cut with an ellipsis. */
export const clip = (text: string, max = TITLE_MAX): string =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

const PRICE_RANGE = "El precio debe estar entre 0,01 € y 100.000 €.";

const readPrice = (
  raw: string,
  allowCents: boolean,
): { value: number } | { error: string } => {
  const price = parsePrice(raw, allowCents);

  if ("error" in price) return price;

  return price.value < PRICE_MIN || price.value > PRICE_MAX
    ? { error: PRICE_RANGE }
    : price;
};

const checkName = (
  raw: string,
  missing: string,
  errors: FormErrors,
): string | null => {
  const name = raw.trim();

  if (!name) {
    errors.name = missing;

    return null;
  }

  if (name.length > NAME_MAX) {
    errors.name = `El nombre admite hasta ${NAME_MAX} caracteres.`;

    return null;
  }

  return name;
};

const checkSessions = (raw: string, errors: FormErrors): number | null => {
  const text = raw.trim();
  const value = Number(text);

  if (!/^\d+$/.test(text) || value < SESSIONS_MIN || value > SESSIONS_MAX) {
    errors.sessions = `El bono tiene entre ${SESSIONS_MIN} y ${SESSIONS_MAX} sesiones.`;

    return null;
  }

  return value;
};

/**
 * What the centre changes itself, with no one at Voone in between: treatments and bono plans. The
 * backend applies these the moment they are sent and keeps the ticket as the record, so the form
 * is an editor, not a request: no reason is asked for.
 */
export const isDirectChange = (context: RequestContext): boolean =>
  context.kind === "service-add" ||
  context.kind === "service-edit" ||
  context.kind === "service-remove" ||
  context.kind === "bono-add" ||
  context.kind === "bono-edit" ||
  context.kind === "bono-remove";

/** The reason a direct change is filed with when the centre writes none. */
export const DIRECT_CHANGE_REASON = "Cambio hecho desde el panel del centro.";

const checkReason = (raw: string, errors: FormErrors, optional = false): string => {
  const reason = raw.trim();

  if (optional && reason === "") return DIRECT_CHANGE_REASON;

  if (reason.length < REASON_MIN) {
    errors.reason = `Explica el motivo de la solicitud (mínimo ${REASON_MIN} caracteres).`;
  } else if (reason.length > REASON_MAX) {
    errors.reason = `El motivo admite hasta ${REASON_MAX} caracteres.`;
  }

  return reason;
};

const checkShortText = (raw: string, errors: FormErrors): string | undefined => {
  const text = raw.trim();

  if (text.length > SHORT_TEXT_MAX) {
    errors.text = `Admite hasta ${SHORT_TEXT_MAX} caracteres. Si necesitas más, cuéntalo en el motivo.`;

    return undefined;
  }

  return text || undefined;
};

const CONFIRM_REMOVAL = "Marca la casilla para confirmar la baja.";
const NOTHING_CHANGED_SERVICE = "Cambia al menos un dato: nombre, precio o categoría.";
const NOTHING_CHANGED_BONO = "Cambia al menos un dato: nombre, precio o sesiones.";

/**
 * The typed values as a request body, or the problems to show next to each field. The body is
 * run through the same parser the proxy uses, so what the form accepts the route accepts; a
 * refusal there (it should not happen) is shown as a general error rather than swallowed.
 */
export const buildChangeRequest = (
  context: RequestContext,
  values: FormValues,
): BuildResult => {
  const errors: FormErrors = {};
  const reason = checkReason(values.reason, errors, isDirectChange(context));
  let raw: Record<string, unknown> | null = null;

  switch (context.kind) {
    case "service-edit": {
      const { treatment, usesCatalogue } = context;
      const proposed: Record<string, unknown> = {};
      const name = checkName(values.name, "Escribe el nombre del tratamiento.", errors);

      if (name !== null && name !== treatment.name) proposed.name = name;

      if (values.price.trim()) {
        const price = readPrice(values.price, usesCatalogue);

        if ("error" in price) errors.price = price.error;
        else if (price.value !== treatment.priceEuro) proposed.priceEuro = price.value;
      }

      if (
        usesCatalogue &&
        values.categoryId &&
        values.categoryId !== treatment.categoryId
      ) {
        proposed.categoryId = values.categoryId;
      }

      if (Object.keys(errors).length === 0 && Object.keys(proposed).length === 0) {
        errors.form = NOTHING_CHANGED_SERVICE;
      }

      raw = {
        type: "SERVICE_EDIT",
        title: clip(`Cambio en «${treatment.name}»`),
        targetRef: { treatmentId: treatment.id },
        proposed,
      };
      break;
    }

    case "service-add": {
      const name = checkName(values.name, "Escribe el nombre del tratamiento.", errors);
      const price = readPrice(values.price, context.usesCatalogue);

      if ("error" in price) errors.price = price.error;
      if (context.usesCatalogue && !values.categoryId) {
        errors.categoryId = "Elige una categoría.";
      }

      raw = {
        type: "SERVICE_ADD",
        title: clip(`Nuevo servicio: ${name ?? ""}`),
        proposed: {
          name: name ?? "",
          priceEuro: "error" in price ? 0 : price.value,
          ...(context.usesCatalogue && values.categoryId
            ? { categoryId: values.categoryId }
            : {}),
        },
      };
      break;
    }

    case "service-remove": {
      if (!values.confirm) errors.confirm = CONFIRM_REMOVAL;

      raw = {
        type: "SERVICE_REMOVE",
        title: clip(`Baja de «${context.treatment.name}»`),
        targetRef: { treatmentId: context.treatment.id },
      };
      break;
    }

    case "bono-add": {
      const name = checkName(values.name, "Escribe el nombre del bono.", errors);
      const price = readPrice(values.price, true);
      const sessions = checkSessions(values.sessions, errors);

      if ("error" in price) errors.price = price.error;

      raw = {
        type: "BONO",
        title: clip(`Nuevo bono: ${name ?? ""}`),
        proposed: {
          action: "add",
          name: name ?? "",
          priceEuro: "error" in price ? 0 : price.value,
          totalSessions: sessions ?? 0,
        },
      };
      break;
    }

    case "bono-edit": {
      const { plan } = context;
      const proposed: Record<string, unknown> = { action: "edit" };
      const name = checkName(values.name, "Escribe el nombre del bono.", errors);

      if (name !== null && name !== plan.name) proposed.name = name;

      if (values.price.trim()) {
        const price = readPrice(values.price, true);

        if ("error" in price) errors.price = price.error;
        else if (price.value !== plan.totalEuro) proposed.priceEuro = price.value;
      }

      if (values.sessions.trim()) {
        const sessions = checkSessions(values.sessions, errors);

        if (sessions !== null && sessions !== plan.totalSessions) {
          proposed.totalSessions = sessions;
        }
      }

      if (Object.keys(errors).length === 0 && Object.keys(proposed).length === 1) {
        errors.form = NOTHING_CHANGED_BONO;
      }

      raw = {
        type: "BONO",
        title: clip(`Cambio en el bono «${plan.name}»`),
        targetRef: { bonoId: plan.id },
        proposed,
      };
      break;
    }

    case "bono-remove": {
      if (!values.confirm) errors.confirm = CONFIRM_REMOVAL;

      raw = {
        type: "BONO",
        title: clip(`Baja del bono «${context.plan.name}»`),
        targetRef: { bonoId: context.plan.id },
        proposed: { action: "remove" },
      };
      break;
    }

    case "reward": {
      const itemMode = values.rewardMode === "item";
      const itemId = itemMode ? values.itemId.trim() : "";
      // Only text mode reads (and validates) the text: the other field is never sent.
      const text = itemMode ? undefined : checkShortText(values.text, errors);

      raw = {
        type: "REWARD",
        title: clip(
          context.label
            ? `Cambio en la recompensa «${context.label}»`
            : "Cambio en las recompensas",
        ),
        ...(context.milestone !== undefined
          ? { targetRef: { milestone: context.milestone } }
          : {}),
        ...(itemId
          ? {
              proposed: {
                itemId,
                ...(context.milestone !== undefined ? { milestone: context.milestone } : {}),
              },
            }
          : text
            ? { proposed: { text } }
            : {}),
      };
      break;
    }

    case "level": {
      const text = checkShortText(values.text, errors);

      raw = {
        type: "LEVEL",
        title: clip(
          context.label
            ? `Cambio en el nivel «${context.label}»`
            : "Cambio en los niveles",
        ),
        ...(context.tier !== undefined ? { targetRef: { tier: context.tier } } : {}),
        ...(text ? { proposed: { text } } : {}),
      };
      break;
    }

    case "other": {
      const title = values.title.trim();

      if (!title || title.length > TITLE_MAX) {
        errors.title = `Escribe un título de hasta ${TITLE_MAX} caracteres.`;
      }

      raw = { type: "OTHER", title };
      break;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const parsed = parseCreateRequest({ ...raw, reason });

  return parsed.ok
    ? { ok: true, body: parsed.value }
    : { ok: false, errors: { form: parsed.message } };
};

/** The body of `POST /api/staff/change-requests/preview`: a ticket without title or reason. */
export interface FlagRequest {
  type: "REWARD" | "SERVICE_EDIT";
  targetRef: Record<string, unknown>;
  proposed: Record<string, unknown>;
}

/**
 * What to ask the what-if for, or null when there is nothing to ask. Only a reward row (it has a
 * milestone) with a catalogue item picked, and a service edit with a valid new price that
 * differs from the current one. Removals, additions, bonos, levels and the rest never ask.
 */
export const buildFlagRequest = (
  context: RequestContext,
  values: FormValues,
): FlagRequest | null => {
  if (context.kind === "reward") {
    const itemId = values.itemId.trim();

    if (context.milestone === undefined || values.rewardMode !== "item" || !itemId) return null;

    return {
      type: "REWARD",
      targetRef: { milestone: context.milestone },
      proposed: { itemId, milestone: context.milestone },
    };
  }

  if (context.kind === "service-edit") {
    if (!values.price.trim()) return null;

    const price = readPrice(values.price, context.usesCatalogue);

    if ("error" in price || price.value === context.treatment.priceEuro) return null;

    return {
      type: "SERVICE_EDIT",
      targetRef: { treatmentId: context.treatment.id },
      proposed: { priceEuro: price.value },
    };
  }

  return null;
};

/** A reward described in words has no catalogue price: the flag says "Sin valorar". */
export const isUnpricedReward = (context: RequestContext, values: FormValues): boolean =>
  context.kind === "reward" &&
  context.milestone !== undefined &&
  values.rewardMode === "text" &&
  values.text.trim().length > 0;

/**
 * The categories a request may pick. A service edit starts from the treatment's own category
 * (or none), so it also gets an empty first item to undo a mistaken pick: it asks for no
 * category change. A new service has no such choice, it must pick one.
 */
export const categoryChoices = (
  context: RequestContext,
  categories: Array<{ id: string; label: string }>,
): Array<{ value: string; label: string }> => {
  const items = categories.map((category) => ({ value: category.id, label: category.label }));

  if (context.kind !== "service-edit") return items;

  return [
    {
      value: "",
      label: context.treatment.categoryId ? "Dejar sin cambios" : "Sin categoría",
    },
    ...items,
  ];
};
