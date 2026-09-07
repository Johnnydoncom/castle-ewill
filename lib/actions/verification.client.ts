import { api } from "@/lib/api/browser";
import { errorState, successState, type FormState } from "./state";
import type { WitnessIdentityRecord } from "./verification";

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
  /**
   * Which check this is, decided server-side.
   *
   * `document_verification` proves who somebody is, once.
   * `smart_selfie_authentication` asks only whether the face in front of the
   * camera is the identity already proved — no document, no second ID check.
   */
  product: string;
  /** Required by the authentication endpoint, which matches against this id. */
  user_id: string;
  /**
   * The enrolment to submit alongside a first verification, or null.
   *
   * Null on a recheck and once the client is already enrolled. Enrolment is
   * what makes every later SmartSelfie check possible — without it,
   * `/v3/authentication` can only answer "no enrolled user found".
   */
  enrolment: { endpoint: string; token: string } | null;
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
  /**
   * Who this is, from our own records.
   *
   * Required on every V3 job — but the element that collects it is not, since
   * we already hold all of it.
   */
  user_details: {
    given_names?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
  };
  /** `camera,upload` — set on `<smart-camera-web>`, which is the only element that reads it. */
  document_capture_modes: string;
  /**
   * Enhanced SmartSelfie™ active liveness — the capture that gives directions.
   *
   * True renders `use-strict-mode` on `<smart-camera-web>`, which forwards it
   * to the selfie screens: randomised head-turn prompts, one at a time, with
   * the capture gated on following them. False leaves the default, which is
   * gated on a smile and tells the client very little.
   */
  strict_liveness: boolean;
  /**
   * Which IDs this client may be checked against, and the shape each takes.
   *
   * Smile ID's own catalogue for Nigeria, narrowed to what this account can
   * actually ask about — the same list the witnesses' check is built from. The
   * regex comes with each type so the number can be checked before anybody is
   * asked for a camera.
   */
  id_types: { type: string; label: string; regex: string }[];
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
    user_details: Record<string, string>;
  } | null;
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
 * Records that this account's face has been enrolled with Smile ID.
 *
 * Reported from their `202`, like a job id. It says the enrolment was
 * accepted, not that it passed — the verdict comes on the webhook — and that
 * is enough, because an accepted enrolment is one `/v3/authentication` can be
 * asked about.
 */
export async function enrolledAction(
  jobId: string | null,
  /**
   * The identity Smile ID enrolled.
   *
   * Ours if they honoured the `User-ID` header, theirs if they generated one —
   * their documentation reserves both. Whichever it is, it is what a later
   * SmartSelfie authentication is matched against, so it is reported rather
   * than assumed.
   */
  smileUserId: string | null = null,
  /** Why it did not happen, when it did not — recorded, not shown. */
  error: string | null = null,
): Promise<void> {
  await api("/verification/enrolled", {
    method: "POST",
    body: { job_id: jobId, user_id: smileUserId, error },
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
/**
 * The witnesses as they stand, read from the browser.
 *
 * Enhanced KYC answers on our webhook rather than in the response, so the
 * screen has to ask again to learn what happened. This asks for the *records*
 * — not the page.
 *
 * `router.refresh()` was tried first and was a bad idea: it re-runs the whole
 * route on the server, which re-renders the form underneath the person filling
 * it in. Every four seconds their half-typed witness vanished. Uncontrolled
 * inputs keep their value only until React replaces them, and a refresh
 * replaces them.
 */
export async function fetchWitnessIdentitiesAction(): Promise<
  WitnessIdentityRecord[] | null
> {
  const result = await api<{ data: WitnessIdentityRecord[] }>(
    "/witness-identities",
  );

  // Null rather than an empty list: a failed read must not look like "your
  // witnesses are gone".
  return result.ok ? result.data.data : null;
}

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
    /*
     * Enhanced KYC asks for at least one contact method beside the name it
     * puts to the authority. It is also what the sandbox matches a test
     * identity on, so without it no witness check can be rehearsed at all.
     */
    email: String(formData.get(`witnesses.${index}.email`) ?? "").trim(),
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
