import { randomInt, randomBytes } from "node:crypto";

import {
  PRIVATE_TOUR_CODE_ALPHABET,
  PRIVATE_TOUR_CODE_LENGTH,
} from "@/config/constants";

/**
 * Phone normalization for the private-tour second factor (ADR-0006).
 *
 * The same number gets typed many ways ("0912 345 678", "+84 912 345 678",
 * "0912345678"), and a mismatch on an otherwise-correct code would read as
 * "wrong code" — indistinguishable from an attacker's guess. Normalizing both
 * sides at write and compare time is what makes the check usable.
 *
 * Deliberately forgiving: strips every non-digit, then rewrites a leading
 * `84` to the local `0` form. Not strict E.164 — these are typed by hand, not
 * resolved by a carrier.
 */
export const normalizePhone = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits;
};

/**
 * Generate a private-tour code.
 *
 * `randomInt` is a CSPRNG, unlike `Math.random`. The alphabet omits look-alike
 * glyphs because these codes get dictated over the phone: a misheard `O` for
 * `0` would otherwise become a wrong-but-valid code.
 */
export const generatePrivateTourCode = (): string => {
  let code = "";
  for (let i = 0; i < PRIVATE_TOUR_CODE_LENGTH; i += 1) {
    code +=
      PRIVATE_TOUR_CODE_ALPHABET[
        randomInt(0, PRIVATE_TOUR_CODE_ALPHABET.length)
      ];
  }
  return code;
};

/**
 * The opaque key identifying one holder of a private tour — the ctm_private
 * cookie value. Not a `User`: private-tour customers never check in publicly
 * and never hold a share link, so they stay outside the ADR-0001 seam.
 */
export const newPrivateTourKey = (): string => {
  return randomBytes(32).toString("hex");
};
