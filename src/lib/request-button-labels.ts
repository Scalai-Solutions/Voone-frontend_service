/**
 * The words on the owner's row buttons for a treatment or a bono (edit and remove). They are icons now, so this one string is both
 * the `aria-label` (the accessible name) and the tooltip text, and the two can never drift.
 */

/** Longest subject (a treatment or pack name) kept in a label; longer names end in an ellipsis. */
export const SUBJECT_LABEL_MAX = 60;

export type RequestButtonKind = "edit" | "remove";

const clipSubject = (text: string): string =>
  text.length <= SUBJECT_LABEL_MAX ? text : `${text.slice(0, SUBJECT_LABEL_MAX - 1).trimEnd()}…`;

export const requestButtonLabel = (kind: RequestButtonKind, subject: string): string => {
  const name = clipSubject(subject.replace(/\s+/g, " ").trim());

  if (kind === "edit") return name ? `Editar ${name}` : "Editar";

  return name ? `Eliminar ${name}` : "Eliminar";
};
