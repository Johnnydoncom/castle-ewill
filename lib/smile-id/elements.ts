/**
 * Smile ID's v12 web components — registering them, and typing their tags.
 *
 * `@smileid/web-sdk` is the **web-components** package, despite its name. It
 * ships the same screens the hosted modal renders, as standalone custom
 * elements, so we own the order, the layout and the submission while they own
 * the capture. The hosted modal — `window.SmileIdentity()` — is a different
 * integration entirely and this application no longer uses it.
 *
 * Three elements are registered and each is mounted **on its own**:
 * `<smileid-consent>`, `<document-capture-screens>`, `<smart-camera-web>`.
 *
 * ## Why they are mounted separately, and not nested
 *
 * Smile ID's flow for Document Verification is
 *
 *     consent  →  document  →  selfie/liveness  →  submit
 *
 * and that order is the point: somebody is asked for the thing they have to go
 * and fetch first, while they are still sitting down, rather than after a
 * camera is already open on their face.
 *
 * `<smart-camera-web capture-id>` **cannot produce that order.** The shipped
 * element hard-codes the reverse — on `selfie-capture-screens.publish` it
 * either publishes (no `capture-id`) or switches to its own document screens.
 * There is no attribute that flips it. It also ignores a
 * `<document-capture-screens>` written as its child, which is what their setup
 * page shows: it renders its own into its shadow root from its own attributes.
 *
 * So the nested arrangement is not used at all. Each element is mounted alone,
 * in the order above, and the images are accumulated across the two publishes
 * — which is exactly the shape of the sample on their payloads page.
 *
 * `capture-id` is therefore never set. Every document attribute goes on the
 * `<document-capture-screens>` we mount ourselves, where it is read directly.
 *
 * @see https://docs.usesmileid.com/developer-resources/sdks/web/web-components/setup
 */

/** Attributes every Smile ID element accepts. Their theming reference. */
type SmileIdElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  "theme-color"?: string;
  /** `"true"` hides the "Powered by Smile ID" footer. A string, never a boolean. */
  "hide-attribution"?: string;
};

declare module "react" {
  /* The JSX intrinsic-element table is only reachable as a namespace. */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "smileid-consent": SmileIdElementProps & {
        "partner-name"?: string;
        "partner-logo"?: string;
        "policy-url"?: string;
        /**
         * `"eu"` starts un-ticked with Allow blocked; anything else
         * auto-detects. Read on **first render only** — set it in the markup,
         * never afterwards.
         */
        "consent-region"?: string;
      };
      /**
       * The document step, mounted on its own and before the camera.
       *
       * Deliberately **not** given `capture-id` on `<smart-camera-web>` — see
       * the note at the top of this file. These attributes are read by this
       * element directly, which is where they work.
       */
      "document-capture-screens": SmileIdElementProps & {
        /** `"camera"` or `"camera,upload"`. Upload-only is not supported. */
        "document-capture-modes"?: string;
        /** Presence, not value: skips the back-of-ID step. */
        "hide-back-of-id"?: string;
        /** Presence, not value: skips the capture-instructions sub-screen. */
        "hide-instructions"?: string;
        /** Presence, not value: shows a back control between sub-screens. */
        "show-navigation"?: string;
        ref?: React.Ref<HTMLElement>;
      };
      "smart-camera-web": SmileIdElementProps & {
        /**
         * Enhanced SmartSelfie active liveness.
         *
         * Not in their theming table, but it is in `observedAttributes()` on
         * the shipped element and the wrapper forwards it to the selfie
         * screens. The value matters: the string `"false"` reads as off.
         */
        "use-strict-mode"?: string;
        ref?: React.Ref<HTMLElement>;
      };
    }
  }
}

/**
 * Registers the elements, once per page.
 *
 * The package is ESM-only and touches `window` on import, so it loads
 * dynamically in the browser rather than at module scope where the server
 * would evaluate it. A module-level promise, not a ref: two mounts would
 * otherwise race to define the same custom elements.
 */
let registration: Promise<void> | null = null;

export function registerSmileIdElements(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  registration ??= (async () => {
    await import("@smileid/web-sdk/consent");
    await import("@smileid/web-sdk/document-capture");
    await import("@smileid/web-sdk/smart-camera-web");
  })().catch((error: unknown) => {
    // A failed load must not be cached as permanent — the next attempt should
    // try again rather than inherit this rejection.
    registration = null;

    throw error;
  });

  return registration;
}

/* -------------------------------------------------------------------------- */
/*  Events                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Where each event is dispatched — which is **not** what the docs say.
 *
 * Their setup page states flatly that every event dispatches on `window`, and
 * lists "listener attached to the element" as the cause when events never
 * fire. That is right for consent and user details, and wrong for the camera:
 * in v12.0.1 `<smart-camera-web>` publishes with
 *
 *     this.dispatchEvent(new CustomEvent("smart-camera-web.publish", …))
 *
 * on *itself*, with no `bubbles`, so it never reaches `window`. Read out of
 * `dist/esm/smart-camera-web.js`, not guessed. Listening where the docs say
 * means the capture never arrives, the flow sits on their "Submitting…" screen
 * forever, and nothing in the console explains why.
 */
export const CONSENT_GRANTED = "smileid-consent.granted";
export const CONSENT_DENIED = "smileid-consent.denied";

/** Dispatched on the `<smart-camera-web>` element itself — see above. */
export const CAPTURE_PUBLISHED = "smart-camera-web.publish";
export const CAPTURE_CLOSED = "smart-camera-web.close";

/**
 * The document frames, on the `<document-capture-screens>` element itself.
 *
 * Same discrepancy as the capture: their setup page says `window`, and
 * `_publishSelectedImages()` on this element dispatches with
 * `this.dispatchEvent(...)` and no `bubbles`.
 *
 * This is the first of the two publishes now — the document is captured
 * before the camera opens on anybody's face.
 */
export const DOCUMENT_PUBLISHED = "document-capture-screens.publish";

/** Their back/close controls on the document step. */
export const DOCUMENT_CANCELLED = "document-capture-screens.cancelled";
export const DOCUMENT_CLOSED = "document-capture-screens.close";

/**
 * Diagnostics the capture emits about its own liveness engine.
 *
 * Enhanced SmartSelfie runs head-pose detection on the device from models it
 * fetches at runtime (MediaPipe WASM, a face-landmarker task, OpenCV). When
 * those cannot load it says so here and drops to an interval capture with no
 * prompts — indistinguishable, at the far end of a support conversation, from
 * "the guided check isn't working". `version` is `1.0.0` when detection is
 * live and `0.0.1` when it fell back.
 */
export const LIVENESS_VERSION = "metadata.active-liveness-version";
export const LIVENESS_FALLBACK = "metadata.mediapipe-fallback-reason";

/**
 * Their image type ids, from the payload reference — and confirmed against
 * `lib/components/selfie/src/capture-shared/constants.ts` in the package.
 */
export const IMAGE_TYPE = {
  selfie: 2,
  documentFront: 3,
  liveness: 6,
  documentBack: 7,
} as const;

export type CapturedImage = { image: string; image_type_id: number };

/** `{ granted, granted_at }` — `granted_at` is ISO 8601. */
export type ConsentDetail = { granted: boolean; granted_at: string };
