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
};

/** Identity fields, which only Biometric KYC carries. */
export type JobIdentity = { country: string; id_type: string; id_number: string };

/**
 * The parts every product shares, in one place.
 *
 * Both jobs this application submits — the verification and the SmartSelfie
 * enrolment made from the same frames — differ only in their endpoint, their
 * token, and whether identity fields are attached. Writing the shared nine
 * fields twice is how the two drifted apart before.
 */
export function buildJobBody(
  basics: JobBasics,
  identity?: JobIdentity,
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

  if (identity) {
    body.append("country", identity.country);
    body.append("id_type", identity.id_type);
    body.append("id_number", identity.id_number);
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
