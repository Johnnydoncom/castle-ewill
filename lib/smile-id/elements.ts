/**
 * Smile ID's v12 web components — registering them, and typing their tags.
 *
 * `@smileid/web-sdk` is the **web-components** package, despite its name. It
 * ships the same screens the hosted modal renders, as standalone custom
 * elements, so we own the order, the layout and the submission while they own
 * the capture. The hosted modal — `window.SmileIdentity()` — is a different
 * integration entirely and this application no longer uses it.
 *
 * Two elements are registered, and only two. Biometric KYC is
 * consent → our ID form → selfie capture → our submission; there is no
 * document to photograph, so `@smileid/web-sdk/document-capture` is not
 * imported and `<document-capture-screens>` is not typed.
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

/** Their image type ids, from the payload reference. */
export const IMAGE_TYPE = {
  selfie: 2,
  liveness: 6,
} as const;

export type CapturedImage = { image: string; image_type_id: number };

/** `{ granted, granted_at }` — `granted_at` is ISO 8601. */
export type ConsentDetail = { granted: boolean; granted_at: string };
