import { api } from "@/lib/api/browser";
import { errorState, successState, type FormState } from "./state";

/**
 * Identity verification's mutations, called directly from the browser.
 *
 * Capture belongs to the Smile ID Web SDK; this module only opens an attempt
 * and forwards what the component published. It decides nothing about the
 * images — not whether there are enough of them, not whether a document is
 * among them. Those are the server's questions, and a browser that answered
 * them itself would turn a precise refusal ("the camera did not capture enough
 * of the check") into a generic one.
 */

/** How the SDK should be configured for this person — decided by the server. */
export type CaptureConfig = {
  /** Whether to photograph an identity document as well as a face. */
  document: boolean;
  /** Smile ID's name for the document type, for the capture frame. */
  document_type: string | null;
  partner_name: string;
  policy_url: string;
};

export async function startVerificationAction(
  documentType?: string | null,
): Promise<
  | { status: "error"; message: string }
  | { status: "success"; attemptId: string; capture: CaptureConfig }
> {
  const result = await api<{
    data: { attempt_id: string; capture: CaptureConfig };
  }>("/verification/start", {
    method: "POST",
    body: documentType ? { document_type: documentType } : {},
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return {
    status: "success",
    attemptId: result.data.data.attempt_id,
    capture: result.data.data.capture,
  };
}

/** One image as `smart-camera-web.publish` hands it over. */
export type PublishedImage = {
  image: string;
  image_type_id: number;
};

/**
 * Completes an attempt.
 *
 * JSON rather than multipart, because that is the shape the images arrive in:
 * the component publishes base64 strings tagged with Smile ID's own
 * `image_type_id`, and re-encoding them into file parts would discard the tag
 * that says which is the selfie and which the document.
 */
export async function submitVerificationAction(input: {
  attemptId: string;
  images: PublishedImage[];
  libraryVersion?: string | null;
  documentType?: string | null;
}): Promise<FormState> {
  if (!input.attemptId) {
    return errorState("That verification attempt was not valid.");
  }

  if (input.images.length === 0) {
    return errorState(
      "No image was captured. Please allow camera access and try again.",
    );
  }

  const result = await api<{ message: string }>("/verification/submit", {
    method: "POST",
    body: {
      attempt_id: input.attemptId,
      images: input.images,
      library_version: input.libraryVersion ?? null,
      document_type: input.documentType ?? null,
    },
  });

  if (!result.ok) {
    return errorState(result.message);
  }

  return successState(result.data.message);
}
