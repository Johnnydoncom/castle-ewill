import { api } from "@/lib/api/browser";
import {
  imagesForSubmission,
  readStart,
  type CapturedImage,
  type SmileIdCaptureConfig,
} from "@/lib/smile-id/capture";
import { errorState, successState, type FormState } from "./state";
import type { WitnessIdentityRecord } from "./verification";

/**
 * Identity verification's mutations, called directly from the browser.
 *
 * Smile ID's JavaScript SDK captures in the browser; the images come to our
 * API, and the backend submits them to Smile ID server to server. This module
 * opens an attempt, sends a capture, and reads the standing a verdict leaves.
 */

/**
 * Opens an attempt, and learns what the capture should do.
 *
 * `config` is null when no vendor is automated — a person decides the attempt,
 * which is a real answer and not a failure. See `readStart` for why any other
 * answer is refused rather than mounted.
 */
export async function startVerificationAction(): Promise<
  | { status: "error"; message: string }
  | { status: "success"; attemptId: string; config: SmileIdCaptureConfig | null }
> {
  const result = await api<{
    data: { attempt_id: string; smile_id?: unknown; smile_id_legacy?: unknown };
  }>("/verification/start", {
    method: "POST",
    body: {},
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  const read = readStart(result.data.data);

  switch (read.kind) {
    case "capture":
      return { status: "success", attemptId: read.attemptId, config: read.config };
    case "manual":
      return { status: "success", attemptId: read.attemptId, config: null };
    case "unavailable":
      return {
        status: "error",
        message:
          "The identity check is unavailable just now. Please try again shortly.",
      };
  }
}

/**
 * Sends a capture to our backend, which submits it to Smile ID.
 *
 * The backend holds the images in memory for the request and writes them
 * nowhere. The route keeps the `legacy` path it was published under.
 */
export async function submitCaptureAction(
  attemptId: string,
  images: readonly CapturedImage[],
): Promise<
  { status: "error"; message: string } | { status: "success"; message: string }
> {
  const result = await api<{ message: string }>("/verification/legacy/submit", {
    method: "POST",
    body: { attempt_id: attemptId, images: imagesForSubmission(images) },
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return { status: "success", message: result.data.message };
}

/**
 * Records that an attempt was handed over, when no vendor is automated.
 *
 * The manual-review path: there is no capture and no Smile ID job, so this is
 * what stops the client's own dashboard offering a retry for an attempt a
 * person is already deciding.
 */
export async function submittedVerificationAction(
  attemptId: string,
  jobId: string | null,
): Promise<FormState> {
  const result = await api<{ message: string }>("/verification/submitted", {
    method: "POST",
    body: { attempt_id: attemptId, job_id: jobId },
  });

  if (!result.ok) {
    return errorState(result.message);
  }

  return successState(result.data.message);
}

/**
 * The witnesses as they stand, read from the browser.
 *
 * This asks for the *records* — not the page. `router.refresh()` was tried
 * first and was a bad idea: it re-runs the whole route on the server, which
 * re-renders the form underneath the person filling it in, and their
 * half-typed witness vanished every few seconds.
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

/**
 * Submits the witnesses' identity details for checking.
 *
 * No file. Smile ID's Enhanced KYC asks the issuing authority whether the ID
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
 * callback rather than in the response to anything the browser did, so a
 * client watching a submitted check has no other way to learn it settled.
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
