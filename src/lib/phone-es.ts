/**
 * Spanish mobile normalization, mirroring the backend's src/modules/members/phone-es.ts.
 *
 * Duplicated rather than shared: there is no monorepo or shared package here, and standing
 * one up for one function is disproportionate. **The backend is the authority** — it holds
 * the same vector table as a test and its result is what reaches the unique index. This copy
 * exists only so the form can validate before a round trip; if the two ever disagree, the
 * server's 422 is what the member sees, and this file is the one that is wrong.
 */

/** Zero-width and bidirectional formatting characters, which paste in invisibly. */
const INVISIBLE = /[​-‏‪-‮⁠﻿]/g;

const SPAIN_COUNTRY_CODE = "34";

/** Spanish mobile subscriber numbers are exactly nine digits and start 6 or 7. */
const ES_MOBILE = /^[67][0-9]{8}$/;

/** Reduces any way a Spanish mobile can be typed to one E.164 string, or null. */
export const normalizeSpanishMobile = (input: string): string | null => {
  // NFKC first: fullwidth digits from an IME are non-digits to \D and would be deleted
  // rather than converted, turning a real number into an empty string.
  const cleaned = input.normalize("NFKC").replace(INVISIBLE, "").trim();

  // Read the plus before stripping, because \D removes it along with the separators.
  const hasPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/\D/g, "");

  let national: string;

  if (hasPlus) {
    // An explicit country code that is not Spain is a foreign number. Rejected rather than
    // reinterpreted as Spanish, which would store a number nobody owns.
    if (!digits.startsWith(SPAIN_COUNTRY_CODE)) {
      return null;
    }

    national = digits.slice(2);
  } else if (digits.startsWith(`00${SPAIN_COUNTRY_CODE}`)) {
    national = digits.slice(4);
  } else if (digits.length === 11 && digits.startsWith(SPAIN_COUNTRY_CODE)) {
    // Unambiguous: no Spanish national number is eleven digits, and none starts with 3.
    national = digits.slice(2);
  } else {
    national = digits;
  }

  // 8xx and 9xx are landlines: real numbers, but they cannot receive the SMS the programme
  // is built on, so accepting one creates a member nobody can reach.
  return ES_MOBILE.test(national) ? `+34${national}` : null;
};
