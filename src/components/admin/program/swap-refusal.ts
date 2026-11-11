/**
 * What to show under the reward list when a swap fails.
 *
 * The backend alone decides what a swap may be and says why, in its own words: today it refuses a
 * gift that cannot be given (no price, no category, medical), a surprise with nothing in the
 * catalogue to give, and a spend outside the room between the rows either side. It no longer
 * refuses a cheaper reward, Bronce-first or the same gift twice in a row, so this screen holds no
 * rule about order or value and no copy for one: its message is shown as it comes, and the
 * fallback is used only when the failure carries none (a dropped connection, a 500).
 */
export const swapRefusalMessage = (error: unknown, fallback: string): string => {
  const detail =
    typeof error === "object" && error !== null && "detail" in error
      ? (error as { detail?: unknown }).detail
      : undefined;

  return typeof detail === "string" && detail.trim() ? detail : fallback;
};
