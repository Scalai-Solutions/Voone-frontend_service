import type {
  ChangeRequest,
  ChangeRequestMessage,
  ChangeRequestType,
} from "./admin-change-requests.ts";

/**
 * A ticket's request in plain English, for the admin: what exactly is being asked, with the
 * current values looked up where the ticket only carries an id.
 *
 * The ticket stores `targetRef` (what it is about: a treatment id, a bono id, a milestone, a
 * tier) and `proposed` (what the centre would like). Neither holds today's values, so the
 * detail page fetches the clinic's treatments and bonos and passes them in `lookup`. Anything
 * not found there is described without an old value rather than guessed.
 */

export interface TreatmentRef {
  name: string;
  priceEuro: number | null;
  categoryId: string | null;
}

export interface BonoRef {
  name: string;
  /** The whole pack. */
  totalEuro: number;
  totalSessions: number;
}

export interface DescribeLookup {
  treatments?: ReadonlyMap<string, TreatmentRef>;
  bonos?: ReadonlyMap<string, BonoRef>;
  /** Category id to its label. */
  categories?: ReadonlyMap<string, string>;
}

export interface RequestDescription {
  /** One short line naming the kind of request. */
  headline: string;
  /** The specifics, one change per line. Never empty. */
  lines: string[];
  /** Ids the ticket points at that are no longer in the catalogue: the apply would fail. */
  missing: string[];
}

/** "45 €", "45.50 €". */
export const formatEuroAmount = (value: number): string =>
  `${Number.isInteger(value) ? String(value) : value.toFixed(2)} €`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const quoted = (name: string): string => `"${name}"`;

const categoryLabel = (id: string, lookup: DescribeLookup): string =>
  lookup.categories?.get(id) ?? id;

const SEE_REASON = "No details were given: see the owner's reason below.";

const describeServiceEdit = (
  target: Record<string, unknown>,
  proposed: Record<string, unknown>,
  lookup: DescribeLookup,
): RequestDescription => {
  const id = str(target.treatmentId) ?? str(proposed.treatmentId);
  const current = id ? lookup.treatments?.get(id) : undefined;
  const missing: string[] = [];
  const label = current ? quoted(current.name) : `treatment ${id ?? "(unknown)"}`;

  if (id && lookup.treatments && !current) missing.push(id);

  const lines: string[] = [];
  const price = num(proposed.priceEuro);
  const name = str(proposed.name);
  const category = str(proposed.categoryId);

  if (price !== undefined) {
    lines.push(
      current && current.priceEuro !== null
        ? `Change price of ${label}: ${formatEuroAmount(current.priceEuro)} → ${formatEuroAmount(price)}`
        : `Change price of ${label} to ${formatEuroAmount(price)}`,
    );
  }

  if (name !== undefined) lines.push(`Rename ${label} to ${quoted(name)}`);

  if (category !== undefined) {
    lines.push(
      current?.categoryId
        ? `Move ${label} from category ${categoryLabel(current.categoryId, lookup)} to ${categoryLabel(category, lookup)}`
        : `Move ${label} to category ${categoryLabel(category, lookup)}`,
    );
  }

  return {
    headline: "Edit a treatment",
    lines: lines.length > 0 ? lines : [SEE_REASON],
    missing,
  };
};

const describeServiceAdd = (
  proposed: Record<string, unknown>,
  lookup: DescribeLookup,
): RequestDescription => {
  const name = str(proposed.name);
  const price = num(proposed.priceEuro);
  const category = str(proposed.categoryId);
  const lines: string[] = [];

  if (name !== undefined) {
    lines.push(
      `Add treatment ${quoted(name)}${price !== undefined ? ` at ${formatEuroAmount(price)}` : ""}`,
    );
  }

  if (category !== undefined)
    lines.push(`Category: ${categoryLabel(category, lookup)}`);

  return {
    headline: "Add a treatment",
    lines: lines.length > 0 ? lines : [SEE_REASON],
    missing: [],
  };
};

const describeServiceRemove = (
  target: Record<string, unknown>,
  proposed: Record<string, unknown>,
  lookup: DescribeLookup,
): RequestDescription => {
  const id = str(target.treatmentId) ?? str(proposed.treatmentId);
  const current = id ? lookup.treatments?.get(id) : undefined;
  const missing = id && lookup.treatments && !current ? [id] : [];

  return {
    headline: "Remove a treatment",
    lines: [
      current
        ? `Remove treatment ${quoted(current.name)}${current.priceEuro !== null ? ` (currently ${formatEuroAmount(current.priceEuro)})` : ""}`
        : `Remove treatment ${id ?? "(unknown)"}`,
    ],
    missing,
  };
};

const describeBono = (
  target: Record<string, unknown>,
  proposed: Record<string, unknown>,
  lookup: DescribeLookup,
): RequestDescription => {
  const action = str(proposed.action);
  const id = str(target.bonoId) ?? str(proposed.bonoId);
  const current = id ? lookup.bonos?.get(id) : undefined;
  const missing = id && lookup.bonos && !current ? [id] : [];
  const label = current ? quoted(current.name) : `voucher ${id ?? "(unknown)"}`;
  const name = str(proposed.name);
  const price = num(proposed.priceEuro);
  const sessions = num(proposed.totalSessions);

  if (action === "add") {
    return {
      headline: "Add a session voucher",
      lines: [
        `Add voucher ${name ? quoted(name) : ""}${price !== undefined ? `: ${formatEuroAmount(price)}` : ""}${sessions !== undefined ? ` for ${sessions} sessions` : ""}`.replace(
          /\s+:/,
          ":",
        ),
      ],
      missing: [],
    };
  }

  if (action === "edit") {
    const lines: string[] = [];

    if (price !== undefined) {
      lines.push(
        current
          ? `Change pack price of ${label}: ${formatEuroAmount(current.totalEuro)} → ${formatEuroAmount(price)}`
          : `Change pack price of ${label} to ${formatEuroAmount(price)}`,
      );
    }

    if (sessions !== undefined) {
      lines.push(
        current
          ? `Change sessions of ${label}: ${current.totalSessions} → ${sessions}`
          : `Change sessions of ${label} to ${sessions}`,
      );
    }

    if (name !== undefined) lines.push(`Rename ${label} to ${quoted(name)}`);

    return {
      headline: "Edit a session voucher",
      lines: lines.length > 0 ? lines : [SEE_REASON],
      missing,
    };
  }

  if (action === "remove") {
    return {
      headline: "Remove a session voucher",
      lines: [`Remove voucher ${label}`],
      missing,
    };
  }

  return {
    headline: "Session voucher request",
    lines: [
      id ? `About voucher ${label}. ${SEE_REASON}` : SEE_REASON,
    ],
    missing,
  };
};

const describeReward = (
  target: Record<string, unknown>,
  proposed: Record<string, unknown>,
): RequestDescription => {
  const milestone = num(target.milestone) ?? num(proposed.milestone);
  const text = str(proposed.text);
  const item = str(proposed.itemId);
  const lines: string[] = [];

  if (milestone !== undefined) lines.push(`Reward at milestone ${milestone}`);
  if (text !== undefined) lines.push(`Proposed reward: ${quoted(text)}`);
  if (item !== undefined) lines.push(`Proposed catalogue item: ${item}`);

  if (num(proposed.milestone) !== undefined && num(target.milestone) !== undefined && proposed.milestone !== target.milestone) {
    lines.push(`Move it to milestone ${String(proposed.milestone)}`);
  }

  return {
    headline: "Change a reward",
    lines: lines.length > 0 ? lines : [SEE_REASON],
    missing: [],
  };
};

const describeLevel = (
  target: Record<string, unknown>,
  proposed: Record<string, unknown>,
): RequestDescription => {
  const tier = str(target.tier) ?? str(proposed.tier);
  const text = str(proposed.text);
  const lines: string[] = [];

  if (tier !== undefined) lines.push(`Level: ${tier}`);
  if (text !== undefined) lines.push(`Proposed benefit: ${quoted(text)}`);

  return {
    headline: "Change a level",
    lines: lines.length > 0 ? lines : [SEE_REASON],
    missing: [],
  };
};

export const describeRequest = (
  type: ChangeRequestType,
  targetRef: unknown,
  proposed: unknown,
  lookup: DescribeLookup = {},
): RequestDescription => {
  const target = isRecord(targetRef) ? targetRef : {};
  const wanted = isRecord(proposed) ? proposed : {};

  switch (type) {
    case "SERVICE_EDIT":
      return describeServiceEdit(target, wanted, lookup);
    case "SERVICE_ADD":
      return describeServiceAdd(wanted, lookup);
    case "SERVICE_REMOVE":
      return describeServiceRemove(target, wanted, lookup);
    case "BONO":
      return describeBono(target, wanted, lookup);
    case "REWARD":
      return describeReward(target, wanted);
    case "LEVEL":
      return describeLevel(target, wanted);
    default:
      return {
        headline: "General request",
        lines: ["Not tied to a specific item: see the owner's reason below."],
        missing: [],
      };
  }
};

/**
 * A timestamp for the admin ("12 Mar 2026, 10:04"). `timeZone` is injectable so tests do not
 * depend on the machine's.
 */
export const formatTimestamp = (iso: string, timeZone?: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
};

/** The notification mail's outcome for the admin: muted, admin only. */
export const emailStatusLine = (
  ticket: Pick<ChangeRequest, "emailSentAt" | "lastEmailError">,
  timeZone?: string,
): string => {
  if (ticket.lastEmailError) return `Email not sent: ${ticket.lastEmailError}`;
  if (ticket.emailSentAt)
    return `Last email sent ${formatTimestamp(ticket.emailSentAt, timeZone)}`;

  return "No email recorded for this request.";
};

/** "Applied on 12 Mar 2026, 10:04 by a@b.c", or null when the ticket was not applied (or the backend does not say). */
export const appliedLine = (
  ticket: Pick<ChangeRequest, "appliedAt" | "appliedByEmail">,
  timeZone?: string,
): string | null => {
  if (!ticket.appliedAt) return null;

  const when = formatTimestamp(ticket.appliedAt, timeZone);

  return `Applied on ${when}${ticket.appliedByEmail ? ` by ${ticket.appliedByEmail}` : ""}`;
};

/**
 * Closing a ticket writes its resolution note into the thread as a Voone message with the very
 * same text. This finds that message (the latest one matching the ticket's current note on a
 * closed ticket) so the thread can label it "Resolution" instead of letting it read as a
 * second, separate reply. After a reopen the note is cleared, so older ones show as replies.
 */
export const resolutionMessageId = (
  ticket: Pick<ChangeRequest, "status" | "resolutionNote">,
  messages: readonly Pick<ChangeRequestMessage, "id" | "authorKind" | "body" | "createdAt">[],
): string | null => {
  if (
    (ticket.status !== "RESOLVED" && ticket.status !== "REJECTED") ||
    !ticket.resolutionNote
  )
    return null;

  const matches = messages.filter(
    (message) =>
      message.authorKind === "VOONE" && message.body === ticket.resolutionNote,
  );

  return matches.length > 0 ? matches[matches.length - 1].id : null;
};
