/**
 * The Prize (Y/N) answer of a catalogue row, as the editor's select holds it and as the save sends
 * it. Three states, because "never said" is not "no": once any row of a catalogue has an answer
 * only the rows marked Y can be a prize, and a row nobody answered is then left out.
 */
export type PrizeAnswer = boolean | null;

export type PrizeChoice = "" | "si" | "no";

export const prizeToChoice = (prize: PrizeAnswer | undefined): PrizeChoice =>
  prize === true ? "si" : prize === false ? "no" : "";

export const choiceToPrize = (choice: string): PrizeAnswer =>
  choice === "si" ? true : choice === "no" ? false : null;

/**
 * What a save sends for a row: the answer, null included, only when it differs from the one the
 * row was loaded (or last saved) with. Sending nothing for an unchanged row means an answer an
 * owner set meanwhile, through a ticket, is not overwritten by an editor that opened before it;
 * sending null for a changed one is what lets "Sin respuesta" actually clear a saved answer.
 */
export const prizeField = (
  prize: PrizeAnswer,
  loaded: PrizeAnswer,
): { prize?: boolean | null } => (prize === loaded ? {} : { prize });

/** Whether any row has an answer, which is what switches the prize filter on. */
export const anyPrizeAnswered = (rows: Array<{ prize: PrizeAnswer }>): boolean =>
  rows.some((row) => row.prize !== null);

/** How many rows are marked Y, for the line that tells the admin what the answers add up to. */
export const prizeCount = (rows: Array<{ prize: PrizeAnswer }>): number =>
  rows.filter((row) => row.prize === true).length;
