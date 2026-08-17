import { api } from "@/lib/api/browser";
import { errorState, successState, type FormState } from "./state";

/**
 * Identity verification's mutations, called directly from the browser.
 *
 * No image passes through here, and that is the whole shape of the hosted
 * integration: this module opens an attempt, receives a token, and later
 * reports that Smile ID accepted the job. The captures go from the client's
 * browser to Smile ID inside their own iframe.
 */

/**
 * Everything `window.SmileIdentity()` is called with, decided by the server.
 *
 * None of it is the browser's to choose: the product follows from whether this
 * is a first verification or a recheck, the branding is company identity, and
 * the token seals the job id so a result cannot be pointed at somebody else.
 */
export type SmileIdConfig = {
  token: string;
  /**
   * Required on the config object, not merely inside the token.
   *
   * Their script validates it and throws before opening anything — which it
   * did, because the minted token already carries one and that looked like
   * enough.
   */
  callback_url: string;
  /** `camera` and `upload`, so an unreadable photograph can be replaced with a file. */
  document_capture_modes?: string[];
  product: string;
  environment: "sandbox" | "production";
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
 * Records that the hosted flow's job was accepted.
 *
 * Not a verdict, and carries nothing: Smile ID already has the captures — the
 * browser uploaded them inside their iframe. This exists so the client's own
 * dashboard stops offering a retry for a check that is already running.
 */
export async function submittedVerificationAction(
  attemptId: string,
): Promise<FormState> {
  const result = await api<{ message: string }>("/verification/submitted", {
    method: "POST",
    body: { attempt_id: attemptId },
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
