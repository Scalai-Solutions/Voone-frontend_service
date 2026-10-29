/**
 * A member's recommendation code, as typed or as read from a `?ref=` link.
 *
 * The backend issues five characters (letters and digits, no I/L/O/0/1) and accepts anything
 * up to ten on sign-up, silently ignoring codes it does not know, so a bad code can never block
 * joining. The form does not rely on that: it only sends a value that has the issued shape, and
 * otherwise sends nothing.
 *
 * The check is deliberately the wider "five letters or digits" rather than the exact issuing
 * alphabet, so a future change to the alphabet cannot make this drop a real code.
 */
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{5}$/;

/**
 * Trims and uppercases a raw value. Returns the code, or null when it is absent or does not have
 * the shape of a code (including a repeated `?ref=a&ref=b`, which arrives as an array).
 */
export const normalizeReferralCode = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;

  const code = raw.trim().toUpperCase();

  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
};
