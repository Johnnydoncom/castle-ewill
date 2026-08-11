import { api } from "@/lib/api/browser";
import { errorState, successState, type FormState } from "./state";

/**
 * Face verification's mutations, called directly from the browser.
 *
 * The challenge sequence is issued and stored server-side (see
 * `verification.ts`'s docblock); this module only starts an attempt and
 * submits the capture, it never invents a challenge of its own.
 */

export type LivenessChallenge = {
  name: string;
  prompt: string;
};

export async function startVerificationAction(): Promise<
  | { status: "error"; message: string }
  | { status: "success"; attemptId: string; challenges: LivenessChallenge[] }
> {
  const result = await api<{
    data: { attempt_id: string; challenges: LivenessChallenge[] };
  }>("/verification/start", { method: "POST" });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return {
    status: "success",
    attemptId: result.data.data.attempt_id,
    challenges: result.data.data.challenges,
  };
}

/**
 * Completes an attempt.
 *
 * The capture is forwarded as multipart rather than re-encoded: base64 in a
 * JSON body would inflate a 2 MB frame by a third for no benefit, and the
 * backend validates the *detected* MIME type, which survives only on a real
 * file part.
 */
export async function submitVerificationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const attemptId = String(formData.get("attemptId") ?? "");
  const capture = formData.get("capture");

  if (!attemptId) return errorState("That verification attempt was not valid.");

  if (!(capture instanceof File) || capture.size === 0) {
    return errorState(
      "No image was captured. Please allow camera access and retry.",
    );
  }

  const body = new FormData();
  body.set("attempt_id", attemptId);
  body.set("capture", capture);

  for (const completed of formData.getAll("completed")) {
    body.append("completed[]", String(completed));
  }

  /*
   * The liveness sequence, forwarded as-is.
   *
   * Nothing is decided here about whether there are enough of them: the
   * active provider decides that server-side, and a deployment on manual
   * review needs none at all. A browser that withheld a short sequence would
   * turn a precise "the camera did not capture enough of the check" into a
   * generic refusal.
   */
  for (const frame of formData.getAll("liveness[]")) {
    if (frame instanceof File && frame.size > 0) {
      body.append("liveness[]", frame);
    }
  }

  const result = await api<{ message: string }>("/verification/submit", {
    method: "POST",
    formData: body,
  });

  if (!result.ok) {
    return errorState(result.message);
  }

  return successState(result.data.message);
}
