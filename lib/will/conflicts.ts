/**
 * Witness / beneficiary conflict detection.
 *
 * Pure and client-safe, so the witnesses page and the wizard can both warn
 * about this without a round trip. **It is not the control.** The same rule is
 * enforced server-side in `SaveWitnessesRequest`, which is what actually
 * prevents the combination from being saved; this copy exists so the warning
 * appears next to the names rather than only after a failed submit.
 *
 * The rule itself: in compliance with the law a gift to an attesting witness is void.
 * The Will survives, but that person inherits nothing — and someone naming
 * their spouse as both would have no way of knowing they had disinherited them.
 */

/**
 * Case- and spacing-insensitive. "john  Doe" and "John Doe" are the same
 * person, and a check defeated by a double space is not a check.
 */
function normaliseName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** The witness names that also appear among the beneficiaries. */
export function conflictingWitnesses(
  beneficiaryNames: Array<string | null | undefined>,
  witnessNames: Array<string | null | undefined>,
): string[] {
  const beneficiaries = new Set(
    beneficiaryNames.filter(Boolean).map((name) => normaliseName(String(name))),
  );

  return witnessNames
    .filter(Boolean)
    .map(String)
    .filter((name) => beneficiaries.has(normaliseName(name)));
}
