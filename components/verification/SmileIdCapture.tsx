"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import {
  startVerificationAction,
  submittedVerificationAction,
  type SmileIdConfig,
} from "@/lib/actions/verification.client";

/**
 * Identity verification, built from Smile ID's web components.
 *
 * ## The flow, and who does what
 *
 * `@smileid/web-sdk` ships the same screens their hosted modal renders, as
 * standalone custom elements. We own the order and the layout; they own the
 * screens. Per their documentation, for Document Verification that order is:
 *
 *     consent → document capture → selfie/liveness → submit
 *
 * Their guide puts `<smileid-user-details>` between the first two. It is left
 * out on purpose: `user_details` is required on the job, but we already hold
 * this person's name, email and phone number, and a form to re-type them on
 * the way to a camera is a step that can only lose people. The backend fills
 * the field from the account instead.
 *
 * The last step is ours: the browser posts one `multipart/form-data` job to
 * Smile ID **directly**, with a short-lived v3 token minted by our backend.
 * The API key never reaches the browser, and no image passes through our
 * servers — owning the flow and relaying the bytes are different things, and
 * only the first was asked for.
 *
 * Their `202` carries `job_id` and `user_id`, which *they* generate. So the
 * attempt id travels in `partner_params` instead, and comes back on the
 * webhook verbatim — that is what correlates a verdict to a person.
 *
 * ## Two things their documentation is emphatic about
 *
 *  - **Events dispatch on `window` — except the one that matters most.**
 *    Their setup page says to listen on `window`, and that is right for
 *    `smileid-consent.*`. But `<smart-camera-web>` publishes with
 *    `this.dispatchEvent(new CustomEvent("smart-camera-web.publish", …))` on
 *    *itself*, and a CustomEvent without `bubbles` does not reach `window`.
 *    Listening there means the capture never arrives, the flow sits on their
 *    "Submitting…" screen forever, and nothing in the console says why. Read
 *    out of the package, not guessed. So that one is bound to the element.
 *  - **Never set `Content-Type`** on the submission. The browser writes the
 *    multipart boundary from the `FormData` itself, and setting the header by
 *    hand breaks the boundary and the parse with it.
 */

/** Their image type ids, from the payload reference. */
const IMAGE_TYPE = {
  selfie: 2,
  documentFront: 3,
  liveness: 6,
  documentBack: 7,
} as const;

type CapturedImage = { image: string; image_type_id: number };

type ConsentDetail = { granted: boolean; granted_at: string };

type CustomElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & { "theme-color"?: string };

/*
 * Typing the custom elements.
 *
 * JSX's intrinsic-element table only exists as a namespace, so there is no
 * module-syntax way to add to it — the rule below has nothing to prefer here.
 * The alternative is casting these tags to `any` at every use, which would
 * lose the attribute names this is written to check.
 */
declare module "react" {
  /* The JSX intrinsic-element table is only reachable as a namespace. */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "smileid-consent": CustomElementProps & {
        "partner-name"?: string;
        "partner-logo"?: string;
        "policy-url"?: string;
      };
      "smart-camera-web": CustomElementProps & {
        /* Presence, not value: `hasAttribute("capture-id")` turns on the document step. */
        "capture-id"?: string;
        ref?: React.Ref<HTMLElement>;
      };
      "document-capture-screens": CustomElementProps & {
        "document-capture-modes"?: string;
      };
    }
  }
}

/**
 * Registers the custom elements, once per page.
 *
 * The package is ESM-only and touches `window` on import, so it is loaded
 * dynamically in the browser rather than imported at module scope where the
 * server would evaluate it. A module-level promise, not a ref: two mounts
 * would otherwise race to define the same elements.
 */
let elementsPromise: Promise<void> | null = null;

function loadElements(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  elementsPromise ??= (async () => {
    await import("@smileid/web-sdk/consent");
    await import("@smileid/web-sdk/document-capture");
    await import("@smileid/web-sdk/smart-camera-web");
  })().catch((error: unknown) => {
    // A failed load must not be cached as permanent — the next attempt should
    // try again rather than inherit this rejection.
    elementsPromise = null;

    throw error;
  });

  return elementsPromise;
}

/** Their examples' base64 → JPEG File, which is what the V3 API expects. */
function toJpegFile(base64: string, filename: string): File {
  const bytes = atob(base64.split(",").pop() ?? "");
  const buffer = Uint8Array.from(bytes, (c) => c.charCodeAt(0));

  return new File([buffer], filename, { type: "image/jpeg" });
}

type Step = "idle" | "loading" | "consent" | "capture";
type Outcome = null | { kind: "done" | "error"; message: string };

export function SmileIdCapture({
  title,
  description,
  footerNote,
  onVerified,
}: {
  title: string;
  description: string;
  footerNote: string;
  onVerified: () => void;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [config, setConfig] = useState<SmileIdConfig | null>(null);

  /*
   * The session, accumulated across four separate events.
   *
   * Refs rather than state: these are read inside listeners bound once, and a
   * closure over state would still be looking at the render that bound it.
   * None of them drives the UI.
   */
  /** The element itself — `smart-camera-web.publish` dispatches on it, not on `window`. */
  const cameraRef = useRef<HTMLElement | null>(null);
  const attemptRef = useRef<string | null>(null);
  const configRef = useRef<SmileIdConfig | null>(null);
  const consentRef = useRef<ConsentDetail | null>(null);
  const documentImagesRef = useRef<CapturedImage[]>([]);

  const fail = useCallback((message: string) => {
    setStep("idle");
    setOutcome({ kind: "error", message });
  }, []);

  const finish = useCallback(
    (message: string) => {
      setStep("idle");
      setOutcome({ kind: "done", message });
      onVerified();
    },
    [onVerified],
  );

  /**
   * Builds and posts the job, then reports the job id back to our API.
   *
   * Every field name is from their Document Verification table. Notably there
   * is **no `id_number`** — identity comes from the scanned document — and
   * `id_type` is omitted so their server auto-classifies against the
   * supported-documents catalogue, which is more forgiving than us guessing
   * from what the client told us earlier.
   */
  const submit = useCallback(
    async (images: CapturedImage[]) => {
      const current = configRef.current;
      const attemptId = attemptRef.current;

      if (current === null || attemptId === null) {
        fail(
          "Your session expired before that could be sent. Please start again.",
        );

        return;
      }

      setStep("loading");

      /*
       * Both sources, merged.
       *
       * Nested inside `<smart-camera-web>`, the wrapper collects the document
       * frames itself and publishes everything in one payload. Mounted
       * separately it does not. Reading both means neither arrangement
       * silently submits a job with no document in it.
       */
      const all = [...images, ...documentImagesRef.current];

      const selfie = all.find((i) => i.image_type_id === IMAGE_TYPE.selfie);
      const front = all.find(
        (i) => i.image_type_id === IMAGE_TYPE.documentFront,
      );

      if (!selfie) {
        fail(
          "The camera did not capture a usable photograph. Please try again.",
        );

        return;
      }

      if (!front) {
        fail("We did not receive a photograph of your ID. Please try again.");

        return;
      }

      const body = new FormData();

      body.append("selfie_image", toJpegFile(selfie.image, "selfie.jpg"));

      // Repeated under one name. Indexed names — `liveness_images[0]` — are
      // their documented failure mode: only one frame arrives.
      all
        .filter((i) => i.image_type_id === IMAGE_TYPE.liveness)
        .forEach((frame, i) => {
          body.append(
            "liveness_images",
            toJpegFile(frame.image, `liveness-${i}.jpg`),
          );
        });

      body.append("document", toJpegFile(front.image, "document-front.jpg"));

      // Only when one was actually published: plenty of IDs have no back, and
      // an empty part is its own error.
      const back = all.find((i) => i.image_type_id === IMAGE_TYPE.documentBack);

      if (back) {
        body.append(
          "document_back",
          toJpegFile(back.image, "document-back.jpg"),
        );
      }

      body.append(
        "consent",
        JSON.stringify({
          ...(consentRef.current ?? { granted: true }),
          notice_language: current.consent.notice_language,
          notice_privacy_policy_url: current.consent.notice_privacy_policy_url,
        }),
      );
      // From our own records, decided server-side — see the note at the top.
      body.append("user_details", JSON.stringify(current.user_details));
      body.append("country", current.country);
      body.append("callback_url", current.callback_url);

      // How the verdict finds this person. Their job id is generated on their
      // side and comes back in the 202; this is ours and survives the round
      // trip untouched.
      body.append("partner_params", JSON.stringify(current.partner_params));

      let jobId: string | null = null;

      try {
        const response = await fetch(current.endpoint, {
          method: "POST",
          // No Content-Type: the browser writes the multipart boundary.
          headers: {
            "smileid-token": current.token,
            Accept: "application/json",
          },
          body,
        });

        const payload = (await response.json().catch(() => ({}))) as {
          job_id?: string;
          message?: string;
          error?: string;
        };

        if (response.status !== 202) {
          console.error(
            "[smile-id] submission refused",
            response.status,
            payload,
          );

          fail(
            payload.message ??
            payload.error ??
            "We could not send your identity check. Please try again.",
          );

          return;
        }

        jobId = payload.job_id ?? null;
      } catch (error) {
        console.error("[smile-id] submission failed", error);

        fail("We could not reach the identity service. Please try again.");

        return;
      }

      /*
       * Told to our own API second, and deliberately not treated as the thing
       * that succeeded: the job is with Smile ID either way, so a failure here
       * must not tell the client to submit again.
       */
      const recorded = await submittedVerificationAction(attemptId, jobId);

      finish(
        recorded.status === "success"
          ? (recorded.message ??
            "Your identity check has been submitted. We will email you as soon as it is confirmed.")
          : "Your identity check has been submitted. We will email you as soon as it is confirmed.",
      );
    },
    [fail, finish],
  );

  /*
   * One set of listeners, bound once, on `window` — where their documentation
   * says these dispatch.
   */
  useEffect(() => {
    const onConsentGranted = (event: Event) => {
      consentRef.current = (event as CustomEvent<ConsentDetail>).detail;
      setStep("capture");
    };

    const onConsentDenied = () => {
      // Respect the decision — their documentation asks not to re-prompt.
      fail(
        "The identity check cannot go ahead without your consent. You can start it again whenever you are ready.",
      );
    };

    const onDocuments = (event: Event) => {
      documentImagesRef.current =
        (event as CustomEvent<{ images: CapturedImage[] }>).detail?.images ?? [];
    };

    const onCapture = (event: Event) => {
      void submit(
        (event as CustomEvent<{ images: CapturedImage[] }>).detail?.images ?? [],
      );
    };

    const onCameraClosed = () => {
      // Their back/close control. Not a failure — the attempt stays open.
      setStep("idle");
      setOutcome(null);
    };

    window.addEventListener("smileid-consent.granted", onConsentGranted);
    window.addEventListener("smileid-consent.denied", onConsentDenied);
    window.addEventListener("document-capture-screens.publish", onDocuments);

    /*
     * Bound to the element, and re-bound whenever it mounts — see the note at
     * the top. `camera` is read at effect time because the element only exists
     * on the capture step.
     */
    const camera = cameraRef.current;

    camera?.addEventListener("smart-camera-web.publish", onCapture);
    camera?.addEventListener("smart-camera-web.close", onCameraClosed);

    return () => {
      window.removeEventListener("smileid-consent.granted", onConsentGranted);
      window.removeEventListener("smileid-consent.denied", onConsentDenied);
      window.removeEventListener(
        "document-capture-screens.publish",
        onDocuments,
      );
      camera?.removeEventListener("smart-camera-web.publish", onCapture);
      camera?.removeEventListener("smart-camera-web.close", onCameraClosed);
    };
  }, [fail, submit, step]);

  const start = useCallback(async () => {
    setStep("loading");
    setOutcome(null);

    try {
      await loadElements();
    } catch (error) {
      console.error("[smile-id] could not load the components", error);

      fail(
        "We could not load the identity check. Check your connection and try again.",
      );

      return;
    }

    const started = await startVerificationAction();

    if (started.status === "error") {
      fail(started.message);

      return;
    }

    attemptRef.current = started.attemptId;

    if (started.smileId === null) {
      // No vendor configured: a person will decide this one. The attempt is
      // real, so it is recorded rather than shown as a broken camera.
      const recorded = await submittedVerificationAction(
        started.attemptId,
        null,
      );

      finish(
        recorded.status === "success"
          ? (recorded.message ?? "Your identity check has been recorded.")
          : "Your identity check has been recorded.",
      );

      return;
    }

    configRef.current = started.smileId;
    setConfig(started.smileId);
    setStep("consent");
  }, [fail, finish]);

  const theme = config?.partner_details.theme_color ?? "#0f1e3d";
  const showsIntro = step === "idle" || step === "loading";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        <div className="p-6 sm:p-8">
          {showsIntro && (
            <div className="text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
              <h2 className="mt-3 font-serif text-xl text-navy">{title}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          )}

          {step === "loading" && (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              Preparing your identity check…
            </p>
          )}

          {outcome && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-6 flex items-start justify-center gap-2 text-sm ${outcome.kind === "done" ? "text-success" : "text-destructive"
                }`}
            >
              {outcome.kind === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="text-left">{outcome.message}</span>
            </p>
          )}

          {step === "idle" && (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              {outcome?.kind === "error" ? "Try again" : "Begin identity check"}
            </button>
          )}

          {/*
            Their screens, mounted one at a time as the flow advances. Each is
            rendered only on its own step: these elements read their attributes
            on first render and do their own layout, so keeping a finished one
            mounted would leave two of their screens on the page at once.
          */}
          {config && step === "consent" && (
            <smileid-consent
              theme-color={theme}
              partner-name={config.partner_details.name}
              partner-logo={config.partner_details.logo_url}
              policy-url={config.partner_details.policy_url}
            />
          )}

          {config && step === "capture" && (
            <smart-camera-web ref={cameraRef} theme-color={theme} capture-id="">
              {/*
                Nested, as their setup page shows, and `capture-id` is what
                turns the document step on: without the attribute the wrapper
                publishes straight after the selfie and the job goes out with
                no document in it — `this.captureId ? setActiveScreen(document)
                : publish()`, read out of the package.
              */}
              <document-capture-screens
                theme-color={theme}
                document-capture-modes={config.document_capture_modes}
              />
            </smart-camera-web>
          )}
        </div>

        {showsIntro && (
          <p className="border-t border-border bg-surface px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}
