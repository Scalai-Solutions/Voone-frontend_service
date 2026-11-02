/**
 * The words on the owner's row request buttons. They are icons now, so this one string is both
 * the `aria-label` (the accessible name) and the tooltip text, and the two can never drift.
 */

/** Longest subject (a treatment or pack name) kept in a label; longer names end in an ellipsis. */
export const SUBJECT_LABEL_MAX = 60;

export type RequestButtonKind = "edit" | "remove";

const clipSubject = (text: string): string =>
  text.length <= SUBJECT_LABEL_MAX ? text : `${text.slice(0, SUBJECT_LABEL_MAX - 1).trimEnd()}…`;

export const requestButtonLabel = (kind: RequestButtonKind, subject: string): string => {
  const name = clipSubject(subject.replace(/\s+/g, " ").trim());

  if (kind === "edit") return name ? `Solicitar cambio en ${name}` : "Solicitar cambio";

  return name ? `Solicitar baja de ${name}` : "Solicitar baja";
};
