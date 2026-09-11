/**
 * Smile ID's JavaScript SDK — `@smileid/web-components` v11, from their CDN.
 *
 * The platform's one Smile ID integration. (The V3 web components were removed
 * on 2026-09-11 at the client's request.) The SDK only captures: it publishes
 * base64 images to the page, the page sends them to our API, and the backend
 * submits them to Smile ID server to server with their PHP library — which is
 * why no token or credential of any kind reaches the browser.
 *
 * ## Loaded from their CDN, not from npm
 *
 * A script tag, as their installation guide shows it, loaded only when a check
 * actually starts, so no page pays for the SDK until somebody opens a camera.
 * `v11` rather than a pinned patch: their guide recommends the major-version
 * URL, which takes their fixes within v11.
 *
 * @see https://legacy-docs.usesmileid.com/integration-options/web-mobile-web/javascript-sdk-beta/installation
 */

export const SMILE_ID_SCRIPT_URL =
  "https://cdn.smileidentity.com/js/v11/smart-camera-web.js";

/**
 * The capture's events — dispatched on the `<smart-camera-web>` element itself.
 *
 * Read out of the v11 bundle: `this.dispatchEvent(new CustomEvent(...))`, with
 * no `bubbles`. A listener on `window` never hears them.
 */
export const CAPTURE_PUBLISHED = "smart-camera-web.publish";
export const CAPTURE_CANCELLED = "smart-camera-web.cancelled";
export const CAPTURE_CLOSED = "smart-camera-web.close";

/** As the SDK publishes it. Their documentation shows `image_type_id` as a string. */
export type CapturedImage = {
  image: string;
  image_type_id: number | string;
};

/** Everything the capture needs, decided by the server. */
export type SmileIdCaptureConfig = {
  product:
    | "document_verification"
    | "smart_selfie_authentication"
    | "smart_selfie_registration";
  job_type: number;
  /**
   * Whether `<smart-camera-web>` gets `capture-id` — selfie, then document.
   * False on a recheck, which is a face and nothing else.
   */
  capture_document: boolean;
  document_capture_modes: string;
  environment: "sandbox" | "production";
  theme_color: string;
};

export type StartAnswer =
  | { kind: "capture"; attemptId: string; config: SmileIdCaptureConfig }
  | { kind: "manual"; attemptId: string }
  | { kind: "unavailable" };

function isCaptureConfig(value: unknown): value is SmileIdCaptureConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SmileIdCaptureConfig).job_type === "number" &&
    typeof (value as SmileIdCaptureConfig).product === "string" &&
    typeof (value as SmileIdCaptureConfig).capture_document === "boolean"
  );
}

/**
 * What `POST /verification/start` answered.
 *
 * - A capture config — under `smile_id`, or under `smile_id_legacy`, which is
 *   where the API answered while two integrations existed. Both are read so a
 *   frontend deploy that lands before the backend's does not break a check.
 * - `smile_id: null` — no vendor is automated; a person decides.
 * - Anything else — a response this was not written for, refused rather than
 *   mounted against a job the server will not accept.
 */
export function readStart(payload: {
  attempt_id: string;
  smile_id?: unknown;
  smile_id_legacy?: unknown;
}): StartAnswer {
  const config = isCaptureConfig(payload.smile_id)
    ? payload.smile_id
    : isCaptureConfig(payload.smile_id_legacy)
      ? payload.smile_id_legacy
      : null;

  if (config) {
    return { kind: "capture", attemptId: payload.attempt_id, config };
  }

  if ("smile_id" in payload && payload.smile_id === null && !payload.smile_id_legacy) {
    return { kind: "manual", attemptId: payload.attempt_id };
  }

  return { kind: "unavailable" };
}

/**
 * The base64 image types Smile ID is sent: selfie, document front, liveness
 * frame, document back. `0` and `1` are *file-path* types in their library, and
 * a path is never something a browser should hand a server.
 */
export const IMAGE_TYPES: readonly number[] = [2, 3, 6, 7];

/** The published images, as the backend takes them. */
export function imagesForSubmission(
  images: readonly CapturedImage[],
): { image: string; image_type_id: number }[] {
  return images
    .map((captured) => ({
      image: captured.image,
      image_type_id: Number(captured.image_type_id),
    }))
    .filter(
      (captured) =>
        IMAGE_TYPES.includes(captured.image_type_id) &&
        typeof captured.image === "string" &&
        captured.image.length > 0,
    );
}

let loading: Promise<boolean> | null = null;

/**
 * Loads the SDK, once per page. Resolves whether `<smart-camera-web>` is defined.
 */
export function loadSmileIdSdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  if (window.customElements.get("smart-camera-web")) return Promise.resolve(true);

  loading ??= new Promise<boolean>((resolve) => {
    const script = document.createElement("script");

    script.src = SMILE_ID_SCRIPT_URL;
    script.async = true;
    script.dataset.smileId = "v11";

    script.onload = () => {
      resolve(Boolean(window.customElements.get("smart-camera-web")));
    };

    script.onerror = () => {
      // Not cached: the next attempt should try the network again.
      script.remove();
      loading = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loading;
}
