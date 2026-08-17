import { api } from "@/lib/api/browser";
import { errorState, successState, type FormState } from "./state";

/**
 * Identity verification's mutations, called directly from the browser.
 *
 * No image passes through here. We own the flow now — the screens are mounted
 * in our own page from `@smileid/web-sdk` — but the job still goes from the
 * client's browser straight to Smile ID's V3 API. This module opens an
 * attempt, receives the token that authorises that post, and afterwards
 * records the job id their 202 returned.
 */

/**
 * Everything `window.SmileIdentity()` is called with, decided by the server.
 *
 * None of it is the browser's to choose: the product follows from whether this
 * is a first verification or a recheck, the branding is company identity, and
 * the token seals the job id so a result cannot be pointed at somebody else.
 */
export type SmileIdConfig = {
  /** Short-lived v3 token, minted by our backend. The API key never leaves it. */
  token: string;
  /** Where the browser posts the job — follows the configured environment. */
  endpoint: string;
  environment: "sandbox" | "production";
  callback_url: string;
  country: string;
  /**
   * How a verdict finds its attempt.
   *
   * Smile ID generate `job_id` and `user_id` themselves and return them in the
   * 202, so — unlike the hosted modal, where we chose the job id — this is what
   * travels with the submission and comes back on the webhook verbatim.
   */
  partner_params: { attempt_id: string };
  consent: { notice_language: string; notice_privacy_policy_url: string };
  document_capture_modes: string;
  partner_details: {
    partner_id: string;
    name: string;
    logo_url: string;
    policy_url: string;
    theme_color: string;
  };
};

export async function startVerificationAction(
  documentType?: string | null,
): Promise<
  | { status: "error"; message: string }
  | { status: "success"; attemptId: string; smileId: SmileIdConfig | null }
> {
  const result = await api<{
    data: { attempt_id: string; smile_id?: SmileIdConfig | null };
  }>("/verification/start", {
    method: "POST",
    body: documentType ? { document_type: documentType } : {},
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  const payload = result.data.data;

  /*
   * `null` and *absent* are different answers, and conflating them is what
   * turned a stale deployment into "can't access property token of undefined".
   *
   * Null is a real answer from a current server: no vendor is configured, so a
   * person will decide this attempt. An absent key means the API answering us
   * predates the hosted flow — there is no token coming, and opening the SDK
   * with `undefined` would throw inside their script where we cannot explain
   * it. Refused here instead, with something the client can act on.
   */
  if (!("smile_id" in payload)) {
    return {
      status: "error",
      message:
        "The identity check is unavailable just now. Please try again shortly.",
    };
  }

  return {
    status: "success",
    attemptId: payload.attempt_id,
    smileId: payload.smile_id ?? null,
  };
}

/**
 * Records that Smile ID accepted the job.
 *
 * Not a verdict: the browser posted the captures to Smile ID directly and read
 * `job_id` from their 202. This records that, so the client's own dashboard
 * stops offering a retry for a check that is already running, and so anyone
 * looking later can find the job.
 */
export async function submittedVerificationAction(
  attemptId: string,
  jobId: string | null,
): Promise<FormState> {
  const result = await api<{ message: string }>("/verification/submitted", {
    method: "POST",
    // The job id is Smile ID's, read from their 202 by the browser that
    // submitted. Null on the manual path, where no vendor job exists.
    body: { attempt_id: attemptId, job_id: jobId },
  });

  if (!result.ok) {
    return errorState(result.message);
  }

  return successState(result.data.message);
}

/**
 * Uploads one witness's identification.
 *
 * Its own endpoint rather than the vault's: these documents belong to people
 * who are not our clients, are read once by a reviewer, and are deleted when
 * the client's verification completes.
 */
export async function uploadWitnessIdentityAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return errorState("Choose a file to upload.");
  }

  const body = new FormData();
  body.set("file", file);

  const result = await api<{ message: string }>("/witness-identities", {
    method: "POST",
    formData: body,
  });

  if (!result.ok) {
    return errorState(result.message);
  }

  return successState(result.data.message);
}
