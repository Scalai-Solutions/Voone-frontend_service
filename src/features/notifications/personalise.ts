/** The variable a message typed by hand may use. Mirrors the backend, which fills it per member. */
export const NAME_VARIABLE = "{first_name}";

const PLACEHOLDER = /\{first_name\}/g;

/** "María José López" -> "María"; empty when there is no name. */
const firstName = (fullName: string | null | undefined): string =>
  (fullName ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * What a member reads: {first_name} replaced by their first name. With no name the placeholder
 * disappears and the punctuation closes up ("¡Hola {first_name}!" -> "¡Hola!"), which is what
 * Google members get from a message sent to everyone (one shared message, so no name).
 */
export const personalise = (
  text: string,
  memberName: string | null | undefined,
): string =>
  text
    .replace(PLACEHOLDER, firstName(memberName))
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

export const usesName = (...texts: string[]): boolean =>
  texts.some((text) => text.includes(NAME_VARIABLE));
