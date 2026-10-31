/**
 * What to show under the reward list when a swap fails.
 *
 * The backend alone decides what a swap may be and says why, in its own words: today it refuses a
 * gift that cannot be given (no price, no category, medical) and the same gift in two
 * consecutive milestones. It no longer refuses a cheaper reward or Bronce-first, so this screen
 * holds no rule about order or value and no copy for one: its message is shown as it comes, and
 * the fallback is used only when the failure carries none (a dropped connection, a 500).
 */
export const swapRefusalMessage = (error: unknown, fallback: string): string => {
  const detail =
    typeof error === "object" && error !== null && "detail" in error
      ? (error as { detail?: unknown }).detail
      : undefined;

  return typeof detail === "string" && detail.trim() ? detail : fallback;
};
