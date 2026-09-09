/**
 * Building and posting a Smile ID V3 job from the browser.
 *
 * The web-components integration means submission is ours: one
 * `multipart/form-data` request carrying the captured images plus the consent,
 * user details and identity fields the product requires. The browser posts it
 * to Smile ID **directly**, with a short-lived v3 token minted by our backend
 * — the API key never reaches the browser, and no image passes through our
 * servers.
 *
 * Every field name here is from their payload reference. Two rules from it are
 * easy to break and expensive to debug:
 *
 *  - **Never set `Content-Type`.** The browser writes the multipart boundary
 *    from the `FormData`; setting the header by hand breaks the boundary and
 *    the server-side parse with it.
 *  - **Repeat `liveness_images` under one name.** Indexed names —
 *    `liveness_images[0]` — are their documented failure mode: exactly one
 *    frame arrives and the job is judged on it.
 *
 * @see https://docs.usesmileid.com/developer-resources/sdks/web/web-components/submitting-payloads
 */

import { IMAGE_TYPE, type CapturedImage, type ConsentDetail } from "./elements";

/** Their example's base64 → JPEG `File`. The V3 API takes files, not strings. */
function toJpegFile(base64: string, filename: string): File {
  const bytes = atob(base64.split(",").pop() ?? "");
  const buffer = Uint8Array.from(bytes, (character) => character.charCodeAt(0));

  return new File([buffer], filename, { type: "image/jpeg" });
}

/** What every job carries, whatever the product. */
export type JobBasics = {
  images: CapturedImage[];
  consent: ConsentDetail | null;
  notice: { notice_language: string; notice_privacy_policy_url: string };
  userDetails: Record<string, string | undefined>;
  callbackUrl: string;
  partnerParams: Record<string, string>;
  /**
   * The enrolled identity, for a SmartSelfie authentication only.
   *
   * A **top-level field**. Their payload reference puts it in
   * `partner_params`; doing that returns `400 Required field 'user_id' is
   * missing or invalid`. Confirmed against the sandbox — see the note in the
   * backend's `webComponentConfig()`.
   */
  userId?: string;
};

/**
 * The document half of a Document Verification job.
 *
 * `country` is required on every document job. **`id_type` is deliberately
 * absent**: their reference makes it optional for this product and omitting it
 * lets their server auto-classify against the supported-documents catalogue,
 * which is more forgiving than asking somebody to name their own document and
 * then refusing the mismatch. And there is no `id_number` at all — "sending
 * one is ignored", because identity comes off the card.
 */
export type JobDocument = { country: string };

/**
 * The parts every product shares, in one place.
 *
 * Both jobs this application submits — the verification and the SmartSelfie
 * enrolment made from the same frames — differ only in their endpoint, their
 * token, and whether the document fields are attached. (The enrolment takes
 * none: `/v3/registration` carries a selfie, consent and user details, and
 * nothing else.) Writing the shared six fields twice is how the two copies
 * drifted apart before.
 */
export function buildJobBody(
  basics: JobBasics,
  document?: JobDocument,
): FormData | null {
  const selfie = basics.images.find(
    (image) => image.image_type_id === IMAGE_TYPE.selfie,
  );

  // No selfie, no job. Returning null rather than throwing keeps the caller's
  // error message about the camera rather than about an exception.
  if (!selfie) return null;

  const body = new FormData();

  body.append("selfie_image", toJpegFile(selfie.image, "selfie.jpg"));

  basics.images
    .filter((image) => image.image_type_id === IMAGE_TYPE.liveness)
    .forEach((frame, index) => {
      body.append(
        "liveness_images",
        toJpegFile(frame.image, `liveness-${index}.jpg`),
      );
    });

  /*
   * Consent, as their schema wants it: the element reports *that* it was
   * granted and when; the notice it was granted against is ours to name, and
   * `notice_language` is `^[A-Z]{2}$` — uppercase, which the backend supplies.
   */
  body.append(
    "consent",
    JSON.stringify({ ...(basics.consent ?? { granted: true }), ...basics.notice }),
  );

  // From our own records. `<smileid-user-details>` collects this, and is
  // deliberately not mounted — see `SmileIdCapture`.
  body.append("user_details", JSON.stringify(basics.userDetails));

  body.append("callback_url", basics.callbackUrl);

  /*
   * How a verdict finds its attempt, and — on a recheck — who the face is
   * compared against. `job_id` and `user_id` are Smile ID's to generate and
   * come back in the 202, so this is what survives the round trip; the webhook
   * echoes it verbatim. The backend decides what goes in it.
   */
  body.append("partner_params", JSON.stringify(basics.partnerParams));

  if (basics.userId) {
    body.append("user_id", basics.userId);
  }

  if (document) {
    body.append("country", document.country);

    /*
     * The document itself. Front is always present on a completed capture;
     * back only when the ID type has one and `hide-back-of-id` was not set, so
     * it is appended only when a frame actually arrived.
     */
    const front = basics.images.find(
      (image) => image.image_type_id === IMAGE_TYPE.documentFront,
    );

    const back = basics.images.find(
      (image) => image.image_type_id === IMAGE_TYPE.documentBack,
    );

    // No document, no document job — the same reasoning as the selfie above.
    if (!front) return null;

    body.append("document", toJpegFile(front.image, "document-front.jpg"));

    if (back) {
      body.append(
        "document_back",
        toJpegFile(back.image, "document-back.jpg"),
      );
    }
  }

  return body;
}

export type JobAccepted = { job_id: string | null; user_id: string | null };

export type JobRefused = { status: number; reason: string };

/**
 * Posts one job and reads their answer.
 *
 * `202` is acceptance, not a verdict — the verdict arrives on the webhook. So
 * this returns the ids to persist for correlation, or a reason to show.
 */
export async function postJob(
  endpoint: string,
  token: string,
  body: FormData,
): Promise<{ ok: true; data: JobAccepted } | { ok: false; error: JobRefused }> {
  const response = await fetch(endpoint, {
    method: "POST",
    // No Content-Type — the browser writes the multipart boundary itself.
    headers: { "smileid-token": token, Accept: "application/json" },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    job_id?: string;
    user_id?: string;
    message?: string;
    error?: string;
  };

  if (response.status !== 202) {
    return {
      ok: false,
      error: {
        status: response.status,
        reason:
          payload.message ??
          payload.error ??
          `Smile ID refused the job (${response.status})`,
      },
    };
  }

  return {
    ok: true,
    data: { job_id: payload.job_id ?? null, user_id: payload.user_id ?? null },
  };
}
