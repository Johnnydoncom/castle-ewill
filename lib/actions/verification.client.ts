import { api } from "@/lib/api/browser";
import { errorState, successState, type FormState } from "./state";

/**
 * Identity verification's mutations, called directly from the browser.
 *
 * No image passes through here, and none through our own code either: the
 * hosted flow (`window.SmileIdentity`) owns its screens and posts the job to
 * Smile ID itself with the token below. This module opens an attempt, receives
 * the config that authorises that flow, and afterwards records what their
 * `onResult` reported.
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
  /**
   * Which of their flows to open, in the SDK's own vocabulary.
   *
   * `doc_verification` proves who somebody is against a government document,
   * once. `authentication` asks only whether the face in front of the camera
   * is the identity already proved. `smartselfie` is a registration — the same
   * short camera check, and it enrols the face so `authentication` has
   * something to match against next time.
   *
   * Note these are *not* the names the token endpoint uses; the server maps
   * between the two, and the mismatch is a documented one.
   */
  product: "doc_verification" | "authentication" | "smartselfie";
  /** True when this run enrols the client, so the browser can stamp it after. */
  enrols: boolean;
  callback_url: string;
  environment: "sandbox" | "production";
  partner_details: {
    partner_id: string;
    name: string;
    logo_url: string;
    policy_url: string;
    theme_color: string;
  };
  /**
   * Enhanced SmartSelfie™ — the guided capture.
   *
   * Randomised head-turn prompts, one at a time, with the capture gated on
   * following them. Off, the capture waits for a smile and tells the client
   * nothing, which is how somebody ends up staring at their own face.
   */
  use_strict_mode: boolean;
  /**
   * Assisted capture — a second person operates the camera.
   *
   * Exclusive with `use_strict_mode` in this integration: Smile ID's reference
   * states agent mode is ignored whenever strict mode is on. With the prompts
   * off, which is how this ships, it is the mode that applies.
   */
  allow_agent_mode: boolean;
  /** Consent we already hold, which skips their consent screen. */
  consent_information: {
    granted: boolean;
    granted_at: string;
    notice_language: string;
    notice_privacy_policy_url: string;
  };
  /** Who this is, from our records, so their user-details form is skipped. */
  user_details: {
    given_names?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
  };
  /**
   * Echoed back on the webhook verbatim.
   *
   * `attempt_id` is how a verdict finds the attempt it belongs to. `user_id`
   * is what an `authentication` job matches against — omit it and the job is
   * refused *after* the client has finished capturing.
   */
  partner_params: { attempt_id: string; user_id: string };
  /** `['camera', 'upload']` — an array here, not the components' comma string. */
  document_capture_modes: string[];
  /** e.g. `{ NG: ['PASSPORT', ...] }`. Null on a SmartSelfie run, which has no document step. */
  id_selection: Record<string, string[]> | null;
  /**
   * Sandbox test mode, or null.
   *
   * The sandbox matches name and email against a fixed table and ignores the
   * photographs, so a real name is refused there. Non-null means the job is
   * being submitted as somebody fictional, and the screen says so.
   */
  test_mode: {
    key: string;
    status: string;
    describes: string;
    user_details: { given_names: string; last_name: string; email?: string };
  } | null;
};

/**
 * Their `onResult` union, as their reference documents it.
 *
 * `value` carries the job only for `doc_verification` and
 * `enhanced_document_verification` today; every other product fires `success`
 * with nothing in it, and the verdict arrives on the webhook either way.
 */
export type SmileIdResult =
  | {
      status: "success";
      value?: { job_id?: string; user_id?: string; status?: string };
    }
  | {
      status: "failure";
      error: {
        error_code: string;
        message?: string;
        retryable?: boolean;
      };
    }
  | { status: "cancelled" };

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
    body: {
      /*
       * Which integration is asking.
       *
       * The two apps deploy separately and the backend arrives first, so for a
       * while a browser holding the previous bundle is talking to today's API.
       * Naming the flow means each is answered in the vocabulary it speaks —
       * without it, the old bundle received a config with none of the keys it
       * reads and died mid-check on a blank error page.
       */
      flow: "hosted",
      ...(documentType ? { document_type: documentType } : {}),
    },
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
 * Records that this account's face has been enrolled with Smile ID.
 *
 * Reported from their `202`, like a job id. It says the enrolment was
 * accepted, not that it passed — the verdict comes on the webhook — and that
 * is enough, because an accepted enrolment is one `/v3/authentication` can be
 * asked about.
 */
export async function enrolledAction(jobId: string | null): Promise<void> {
  await api("/verification/enrolled", {
    method: "POST",
    body: { job_id: jobId },
  });
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
/**
 * Submits both witnesses' identity details for checking.
 *
 * Both at once, because the attestation has two signatories and a client is
 * looking at both IDs on the table in front of them. Asking for one and then
 * the other turns a single sitting into two, and is how the second witness
 * never gets entered at all.
 *
 * No file. Smile ID's Basic KYC asks the issuing authority whether the ID
 * number belongs to the name, so no third party's identity document is
 * uploaded, transmitted or held anywhere.
 */
export async function submitWitnessIdentitiesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  /*
   * However many the form rendered, not always two.
   *
   * A witness the authority has already confirmed is not a field on that form
   * and is not sent again: re-checking one spends a paid lookup to be told
   * what we know, and an authority that is down this minute could take a
   * confirmed witness back to unverified. The server keeps those rows and
   * checks only what arrives here.
   */
  const indices = [
    ...new Set(
      [...formData.keys()]
        .map((key) => /^witnesses\.(\d+)\./.exec(key)?.[1])
        .filter((index): index is string => index !== undefined),
    ),
  ].map(Number).sort((a, b) => a - b);

  const witnesses = indices.map((index) => ({
    first_name: String(formData.get(`witnesses.${index}.first_name`) ?? "").trim(),
    middle_name: String(formData.get(`witnesses.${index}.middle_name`) ?? "").trim(),
    last_name: String(formData.get(`witnesses.${index}.last_name`) ?? "").trim(),
    id_type: String(formData.get(`witnesses.${index}.id_type`) ?? "").trim(),
    id_number: String(formData.get(`witnesses.${index}.id_number`) ?? "").trim(),
  }));

  const result = await api<{ message: string }>("/witness-identities", {
    method: "POST",
    body: { witnesses },
  });

  if (!result.ok) {
    /*
     * Echoed back so the form can repopulate. React resets an uncontrolled
     * `<form action>` on any settled promise, and re-typing four fields
     * because one ID number was mistyped is how somebody gives up.
     */
    return {
      ...errorState(result.message, result.fieldErrors),
      values: Object.fromEntries(
        [...formData.entries()].map(([key, value]) => [key, String(value)]),
      ),
    };
  }

  return successState(result.data.message);
}

/**
 * The caller's current verification standing.
 *
 * A read, in a file of mutations, for one reason: the verdict arrives on a
 * webhook rather than in the response to anything the browser did, so a client
 * watching a submitted check has no other way to learn it settled.
 */
export async function getVerificationStatusAction(): Promise<
  | { status: "error"; message: string }
  | {
      status: "success";
      data: {
        is_verified: boolean;
        latest: { status: string; provider: string } | null;
      };
    }
> {
  const result = await api<{
    data: {
      is_verified: boolean;
      latest: { status: string; provider: string } | null;
    };
  }>("/verification", { method: "GET" });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return { status: "success", data: result.data.data };
}
