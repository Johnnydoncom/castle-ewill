import { WILL_STEPS } from "@/lib/will/steps";

/**
 * Where the gateway's return page sends a client whose payment has settled.
 *
 * Paying is never the end of anything, so this is the next thing owed:
 *
 *  - the lodging fee for an update → back to that Will's final step, where the
 *    identity check starts by itself and then submits the update;
 *  - a renewal → back to that Will's page, where its download is open again;
 *  - anything else → identity verification for somebody not yet proved, or
 *    their Wills for somebody who is.
 *
 * `return_to` is a name the server stored at checkout and echoes only for the
 * payer's own payment — never an address — so nothing here can be steered off
 * the site.
 */
export function destinationAfterPayment(
  data: Record<string, unknown> | undefined,
  isKycVerified: boolean,
): string {
  const willId = data?.will_id;

  if (data?.return_to === "will_update" && typeof willId === "string" && willId !== "") {
    const review =
      WILL_STEPS.find((step) => step.slug === "review")?.step ?? WILL_STEPS.length;

    return `/dashboard/wills/${encodeURIComponent(willId)}/edit?step=${review}&lodging=paid`;
  }

  if (data?.return_to === "will" && typeof willId === "string" && willId !== "") {
    return `/dashboard/wills/${encodeURIComponent(willId)}?payment=success`;
  }

  return isKycVerified
    ? "/dashboard/wills?payment=success"
    : "/dashboard/kyc?payment=success";
}
