"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  startVerificationAction,
  enrolledAction,
  submittedVerificationAction,
  type SmileIdConfig,
} from "@/lib/actions/verification.client";
import {
  CAPTURE_CLOSED,
  CAPTURE_PUBLISHED,
  CONSENT_DENIED,
  CONSENT_GRANTED,
  DOCUMENT_CANCELLED,
  DOCUMENT_CLOSED,
  DOCUMENT_PUBLISHED,
  LIVENESS_FALLBACK,
  LIVENESS_VERSION,
  registerSmileIdElements,
  type CapturedImage,
  type ConsentDetail,
} from "@/lib/smile-id/elements";
import { buildJobBody, postJob, type JobBasics } from "@/lib/smile-id/job";

import { CaptureGuidance } from "./CaptureGuidance";

/**
 * Identity verification, built from Smile ID's v12 web components.
 *
 * ## The flow — Document Verification
 *
 *     consent  →  document front (+ back)  →  selfie + liveness  →  submit
 *
 * Smile ID's own order, and the order matters: the client is asked for the
 * thing they may have to go and fetch **first**, while they are still sitting
 * down, rather than after a camera is already open on their face.
 *
 * Their components render all three capture steps; the submission is ours.
 * Everything that is not a decision — which product, which endpoint, whether
 * there is a document step at all, whose name goes on the job — is decided by
 * the backend and arrives in one config object, so nothing here is a rule the
 * server does not also hold.
 *
 * ## Each element is mounted on its own, and that is what makes the order
 *
 * `<smart-camera-web capture-id>` can also drive a document step, and cannot
 * produce this order: it hard-codes selfie → document, with no attribute to
 * flip it. So the nested arrangement is not used. The elements are mounted one
 * at a time and the frames accumulate across two publishes — the shape of the
 * sample on their payloads page.
 *
 * ## One departure from their guide
 *
 * **`<smileid-user-details>` is not mounted.** `user_details` is required on
 * every V3 job, but we already hold this person's name, email and phone
 * number. A form to re-type them on the way to a camera is a step that can
 * only lose people, so the backend fills the field from the account.
 *
 * The hosted Web SDK — `window.SmileIdentity()` — is a separate integration and
 * is gone. The npm package is *named* `@smileid/web-sdk` and is the components
 * package; that stays.
 *
 * @see https://docs.usesmileid.com/developer-resources/sdks/web/web-components
 */

type Step = "idle" | "loading" | "consent" | "document" | "capture";
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
   * The session, accumulated across separate events.
   *
   * Refs rather than state: these are read inside listeners bound once, and a
   * closure over state would still be looking at the render that bound it.
   * None of them drives the UI.
   */
  const cameraRef = useRef<HTMLElement | null>(null);
  const documentElementRef = useRef<HTMLElement | null>(null);
  const attemptRef = useRef<string | null>(null);
  const configRef = useRef<SmileIdConfig | null>(null);
  const consentRef = useRef<ConsentDetail | null>(null);

  /*
   * The document frames, held between the two publishes.
   *
   * They arrive first, on their own element, and are needed when the camera
   * publishes some minutes later — so they cannot live in the capture event.
   */
  const documentRef = useRef<CapturedImage[]>([]);

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
   * The enrolment, made from the same frames.
   *
   * `/v3/authentication` — every later check that this is still the same
   * person — matches a face against an identity registered under a user id.
   * Nothing registers one unless we ask, so the frames just captured are
   * submitted a second time to `/v3/registration`: one capture, two jobs, no
   * second appointment with the camera.
   *
   * Deliberately after the verification and deliberately non-fatal. The
   * identity check has already succeeded; failing it now because an enrolment
   * did not take would refuse somebody for a convenience they never asked for.
   * A client who ends up unenrolled is asked for a full check again later,
   * which is recoverable — one refused here is stuck.
   *
   * The failure is *reported*, not merely logged: a browser console is not
   * somewhere anybody looks, and an enrolment that never succeeded left every
   * recheck falling back to a full check with nothing anywhere saying why.
   */
  const enrol = useCallback(async (basics: JobBasics, current: SmileIdConfig) => {
    if (!current.enrolment) return;

    try {
      const body = buildJobBody(basics);

      if (!body) return;

      const result = await postJob(
        current.enrolment.endpoint,
        current.enrolment.token,
        body,
      );

      if (result.ok) {
        /*
         * Their `user_id`, kept because every later authentication is matched
         * against it. It is ours only while Smile ID honour the `User-ID`
         * header, which their documentation makes optional for them — and the
         * header cannot be sent from a browser anyway: it is absent from the
         * `access-control-allow-headers` on their preflight, so sending it is
         * a request the browser refuses to make.
         */
        await enrolledAction(result.data.job_id, result.data.user_id);

        return;
      }

      console.error("[smile-id] enrolment refused", result.error);

      await enrolledAction(
        null,
        null,
        `${result.error.status} ${result.error.reason}`.slice(0, 500),
      );
    } catch (error) {
      console.error("[smile-id] enrolment failed", error);

      await enrolledAction(null, null, String(error).slice(0, 500));
    }
  }, []);

  /** Builds and posts the verification, then records the job id with our API. */
  const submit = useCallback(
    async (images: CapturedImage[]) => {
      const current = configRef.current;
      const attemptId = attemptRef.current;

      if (current === null || attemptId === null) {
        fail("Your session expired before that could be sent. Please start again.");

        return;
      }

      setStep("loading");

      /*
       * Both publishes, merged.
       *
       * The camera brings the selfie and the liveness frames; the document
       * step brought its own some minutes earlier. De-duplicated by type and
       * preferring what just published, so retaking a page cannot leave the
       * older frame in the job.
       */
      const seen = new Set(images.map((image) => image.image_type_id));

      const allImages = [
        ...images,
        ...documentRef.current.filter((image) => !seen.has(image.image_type_id)),
      ];

      const basics: JobBasics = {
        images: allImages,
        consent: consentRef.current,
        notice: current.consent,
        userDetails: current.user_details,
        callbackUrl: current.callback_url,
        partnerParams: current.partner_params,
      };

      /*
       * The document half, on a first check only. A recheck matches a face
       * against an enrolment and has no document field to carry — and it is
       * the server that decided which this is.
       */
      const body = buildJobBody(
        basics,
        current.document_capture ? { country: current.country } : undefined,
      );

      if (!body) {
        fail("The camera did not capture everything we need. Please try again.");

        return;
      }

      let jobId: string | null = null;

      try {
        const result = await postJob(current.endpoint, current.token, body);

        if (!result.ok) {
          console.error("[smile-id] submission refused", result.error);
          fail(result.error.reason);

          return;
        }

        jobId = result.data.job_id;
      } catch (error) {
        console.error("[smile-id] submission failed", error);
        fail("We could not reach the identity service. Please try again.");

        return;
      }

      await enrol(basics, current);

      /*
       * Told to our own API second, and deliberately not treated as the thing
       * that succeeded: the job is with Smile ID either way, so a failure here
       * must not tell the client to submit again.
       */
      const recorded = await submittedVerificationAction(attemptId, jobId);

      finish(
        (recorded.status === "success" ? recorded.message : null) ??
        "Your identity check has been submitted. We will email you as soon as it is confirmed.",
      );
    },
    [enrol, fail, finish],
  );

  /*
   * Consent, which dispatches on `window` — bound once, for the life of the
   * component.
   */
  useEffect(() => {
    const onGranted = (event: Event) => {
      consentRef.current = (event as CustomEvent<ConsentDetail>).detail;

      /*
       * The document first, when this check has one. A recheck has none — it
       * matches a face against an enrolment — and goes straight to the camera.
       */
      setStep(configRef.current?.document_capture ? "document" : "capture");
    };

    const onDenied = () => {
      // Their documentation asks that the decision not be re-prompted.
      fail(
        "The identity check cannot go ahead without your consent. You can start it again whenever you are ready.",
      );
    };

    window.addEventListener(CONSENT_GRANTED, onGranted);
    window.addEventListener(CONSENT_DENIED, onDenied);

    return () => {
      window.removeEventListener(CONSENT_GRANTED, onGranted);
      window.removeEventListener(CONSENT_DENIED, onDenied);
    };
  }, [fail]);

  /*
   * The document step, which dispatches on its own element.
   *
   * Bound when it mounts, which is only on the document step. Its publish is
   * the *first* of the two — the frames are kept and the flow moves on to the
   * camera; nothing is submitted until the selfie arrives, because both are
   * required in the same request.
   */
  useEffect(() => {
    const element = documentElementRef.current;

    if (step !== "document" || element === null) return;

    const onPublish = (event: Event) => {
      documentRef.current =
        (event as CustomEvent<{ images: CapturedImage[] }>).detail?.images ?? [];

      setStep("capture");
    };

    // Their back control. Not a failure — the attempt stays open, and the
    // frames are dropped so a half-finished capture cannot reach a job.
    const onCancelled = () => {
      documentRef.current = [];
      setStep("idle");
      setOutcome(null);
    };

    element.addEventListener(DOCUMENT_PUBLISHED, onPublish);
    element.addEventListener(DOCUMENT_CANCELLED, onCancelled);
    element.addEventListener(DOCUMENT_CLOSED, onCancelled);

    return () => {
      element.removeEventListener(DOCUMENT_PUBLISHED, onPublish);
      element.removeEventListener(DOCUMENT_CANCELLED, onCancelled);
      element.removeEventListener(DOCUMENT_CLOSED, onCancelled);
    };
  }, [step]);

  /*
   * The capture, which dispatches on the **element** — see `elements.ts`.
   * Bound when it mounts, which is only on the capture step.
   */
  useEffect(() => {
    const camera = cameraRef.current;

    if (step !== "capture" || camera === null) return;

    const onPublish = (event: Event) => {
      void submit(
        (event as CustomEvent<{ images: CapturedImage[] }>).detail?.images ?? [],
      );
    };

    // Their back control. Not a failure — the attempt stays open.
    const onClose = () => {
      setStep("idle");
      setOutcome(null);
    };

    const onVersion = (event: Event) => {
      const detail = (event as CustomEvent<{ version?: string }>).detail;

      console.info("[smile-id] active liveness version", detail?.version);
    };

    const onFallback = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: string }>).detail;

      console.error(
        "[smile-id] face detection unavailable — the guided prompts cannot run",
        detail?.reason,
      );
    };

    camera.addEventListener(CAPTURE_PUBLISHED, onPublish);
    camera.addEventListener(CAPTURE_CLOSED, onClose);
    camera.addEventListener(LIVENESS_VERSION, onVersion);
    camera.addEventListener(LIVENESS_FALLBACK, onFallback);

    return () => {
      camera.removeEventListener(CAPTURE_PUBLISHED, onPublish);
      camera.removeEventListener(CAPTURE_CLOSED, onClose);
      camera.removeEventListener(LIVENESS_VERSION, onVersion);
      camera.removeEventListener(LIVENESS_FALLBACK, onFallback);
    };
  }, [step, submit]);

  const start = useCallback(async () => {
    setStep("loading");
    setOutcome(null);

    try {
      await registerSmileIdElements();
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
      const recorded = await submittedVerificationAction(started.attemptId, null);

      finish(
        (recorded.status === "success" ? recorded.message : null) ??
        "Your identity check has been recorded.",
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
        {/*
          Said plainly, at the top, whenever it is on.

          The sandbox judges the name rather than the photographs, so a test run
          submits as somebody fictional. A test run that looks exactly like a
          real one is how a made-up name ends up in a support conversation.
        */}
        {config?.test_mode && (
          <div className="flex items-start gap-3 border-b border-gold/40 bg-gold/10 px-6 py-4 text-xs leading-relaxed text-navy">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p>
              <strong className="font-medium">Test mode.</strong> Submitting as{" "}
              {config.test_mode.user_details.given_names}{" "}
              {config.test_mode.user_details.last_name} — not you.{" "}
              {config.test_mode.describes}.
            </p>
          </div>
        )}

        <div className="">
          {showsIntro && (
            <div className="text-center p-6 sm:p-8">
              <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
              <h2 className="mt-3 font-serif text-xl text-navy">{title}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          )}

          {step === "loading" && (
            <p className="p-6 sm:p-8 mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              Preparing your identity check…
            </p>
          )}

          {outcome && (
            <p
              role="status"
              aria-live="polite"
              className={`p-6 sm:p-8mt-6 flex items-start justify-center gap-2 text-sm ${outcome.kind === "done" ? "text-success" : "text-destructive"
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
            <div className="p-6 sm:p-8 !pt-0">
              <CaptureGuidance />

              <button
                type="button"
                onClick={() => void start()}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
              >
                {outcome?.kind === "error" ? "Try again" : "Begin identity check"}
              </button>
            </div>
          )}

          {/*
            Their screens, mounted one at a time as the flow advances.

            Each renders only on its own step. These elements read their
            attributes on first render and do their own layout, so keeping a
            finished one mounted would leave two of their screens on the page.
          */}
          {config && step === "consent" && (
            <smileid-consent
              theme-color={theme}
              partner-name={config.partner_details.name}
              partner-logo={config.partner_details.logo_url}
              policy-url={config.partner_details.policy_url}
              consent-region="ng"

            />
          )}

          {config?.document_capture && step === "document" && (
            /*
              The document, before the camera — Smile ID's own order.

              Mounted on its own rather than nested inside
              `<smart-camera-web capture-id>`, which is the only way to get
              this order: that element hard-codes selfie → document.
            */
            <document-capture-screens
              ref={documentElementRef}
              theme-color={theme}
              document-capture-modes={config.document_capture.modes}
            />
          )}

          {config && step === "capture" && (
            /*
              The selfie and its liveness frames.

              No `capture-id`: the document is already captured, and setting it
              would send this element looking for a second one.
            */
            <smart-camera-web
              ref={cameraRef}
              theme-color={theme}
              use-strict-mode={config.strict_liveness ? "true" : undefined}
            />
          )}
        </div>

        {showsIntro && (
          <p className="p-6 sm:p-8 border-t border-border bg-surface px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}
