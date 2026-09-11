/**
 * Smile ID's **legacy** JavaScript SDK — `@smileid/web-components` v11.
 *
 * Selectable in the console beside the current integration (`elements.ts`,
 * `@smileid/web-sdk` v12), and deliberately kept apart from it. The two
 * generations differ in where the job goes:
 *
 *  - **Current (V3).** The browser posts the multipart job to Smile ID
 *    directly, with a short-lived token. No image reaches our servers.
 *  - **Legacy.** The v11 SDK only captures. The page sends the base64 images to
 *    our API, and the backend submits them to the v1 API with Smile ID's PHP
 *    library — server to server, as their legacy documentation prescribes.
 *
 * ## Loaded from their CDN, not from npm
 *
 * Both packages define the same custom-element names (`smart-camera-web`,
 * `document-capture-screens`, …) and a page can hold only one definition of a
 * name. Installing v11 beside v12 would put two registrations in one bundle
 * graph; a script tag loaded only when the legacy integration is chosen keeps
 * the V3 bundle exactly as it was.
 *
 * `v11` rather than a pinned patch: their installation guide recommends the
 * major-version URL, which takes their fixes within v11.
 *
 * @see https://legacy-docs.usesmileid.com/integration-options/web-mobile-web/javascript-sdk-beta/installation
 */

export type SmileIdVersion = "v3" | "legacy";

export const LEGACY_SCRIPT_URL =
  "https://cdn.smileidentity.com/js/v11/smart-camera-web.js";

/**
 * The capture's events — dispatched on the `<smart-camera-web>` element itself.
 *
 * Read out of the v11 bundle: `this.dispatchEvent(new CustomEvent(...))`, with
 * no `bubbles`, the same as v12. A listener on `window` never hears them.
 */
export const LEGACY_CAPTURE_PUBLISHED = "smart-camera-web.publish";
export const LEGACY_CAPTURE_CANCELLED = "smart-camera-web.cancelled";
export const LEGACY_CAPTURE_CLOSED = "smart-camera-web.close";

/** As the SDK publishes it. Their documentation shows `image_type_id` as a string. */
export type LegacyCapturedImage = {
  image: string;
  image_type_id: number | string;
};

/** Everything the legacy capture needs, decided by the server. */
export type LegacySmileIdConfig = {
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

export type LegacyStart =
  | { kind: "capture"; attemptId: string; config: LegacySmileIdConfig }
  | { kind: "manual"; attemptId: string }
  | { kind: "changed" };

/**
 * What `POST /verification/start` answered, for the legacy capture.
 *
 * Three answers, and conflating any two is a fault:
 *
 *  - `smile_id_legacy` — capture.
 *  - `smile_id: null` — no vendor is automated; a person decides, exactly as on
 *    the current integration.
 *  - anything else, a V3 config above all — the integration was switched
 *    since this page loaded. Refused, rather than mounting v11 against a job
 *    the server will not accept.
 */
export function readLegacyStart(payload: {
  attempt_id: string;
  smile_id?: unknown;
  smile_id_legacy?: LegacySmileIdConfig | null;
}): LegacyStart {
  if (payload.smile_id_legacy) {
    return {
      kind: "capture",
      attemptId: payload.attempt_id,
      config: payload.smile_id_legacy,
    };
  }

  if ("smile_id" in payload && payload.smile_id === null) {
    return { kind: "manual", attemptId: payload.attempt_id };
  }

  return { kind: "changed" };
}

/**
 * The base64 image types the v1 API is sent: selfie, document front, liveness
 * frame, document back. `0` and `1` are *file-path* types in their library, and
 * a path is never something a browser should hand a server.
 */
export const LEGACY_IMAGE_TYPES: readonly number[] = [2, 3, 6, 7];

/** The published images, as the backend takes them. */
export function legacyImages(
  images: readonly LegacyCapturedImage[],
): { image: string; image_type_id: number }[] {
  return images
    .map((captured) => ({
      image: captured.image,
      image_type_id: Number(captured.image_type_id),
    }))
    .filter(
      (captured) =>
        LEGACY_IMAGE_TYPES.includes(captured.image_type_id) &&
        typeof captured.image === "string" &&
        captured.image.length > 0,
    );
}

export type LegacyLoad = "ready" | "conflict" | "failed";

let loading: Promise<LegacyLoad> | null = null;

/**
 * Loads the v11 SDK, once per page.
 *
 * **`conflict`** when the current integration's elements are already
 * registered on this page — a client-side navigation from a V3 check. v11's
 * `customElements.define` is guarded by `customElements.get`, so it would
 * quietly keep v12's `<smart-camera-web>`, and a capture would run with the
 * wrong element and the wrong events. Only a reload clears a registry.
 */
export function loadLegacySmileId(): Promise<LegacyLoad> {
  if (typeof window === "undefined") return Promise.resolve("failed");

  if (loading) return loading;

  if (window.customElements.get("smart-camera-web")) {
    return Promise.resolve("conflict");
  }

  loading = new Promise<LegacyLoad>((resolve) => {
    const script = document.createElement("script");

    script.src = LEGACY_SCRIPT_URL;
    script.async = true;
    script.dataset.smileIdLegacy = "v11";

    script.onload = () => {
      resolve(window.customElements.get("smart-camera-web") ? "ready" : "failed");
    };

    script.onerror = () => {
      // Not cached: the next attempt should try the network again.
      script.remove();
      loading = null;
      resolve("failed");
    };

    document.head.appendChild(script);
  });

  return loading;
}
