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
  startLegacyVerificationAction,
  submitLegacyVerificationAction,
  submittedVerificationAction,
} from "@/lib/actions/verification.client";
import {
  LEGACY_CAPTURE_CANCELLED,
  LEGACY_CAPTURE_CLOSED,
  LEGACY_CAPTURE_PUBLISHED,
  legacyImages,
  loadLegacySmileId,
  type LegacyCapturedImage,
  type LegacySmileIdConfig,
} from "@/lib/smile-id/legacy";

import { CaptureGuidance } from "./CaptureGuidance";

/**
 * Identity verification on Smile ID's **legacy** integration.
 *
 * The counterpart of `SmileIdCapture`, which is untouched by this file: the
 * two are chosen between by `IdentityCapture`, from the version the console
 * has selected. Same props, same outcomes, so the pages around a check do not
 * know or care which generation ran it.
 *
 * ## The flow
 *
 *     start  →  <smart-camera-web>  →  our API  →  Smile ID v1
 *
 * Their v11 SDK runs the capture — selfie and liveness, then the document when
 * the server asked for one (`capture-id`) — and publishes base64 images. Those
 * go to **our** backend, which submits the job with Smile ID's PHP library: the
 * legacy API is server to server, and the key that signs it never leaves the
 * server.
 *
 * ## Mounted imperatively
 *
 * The element is created with `document.createElement` and given its
 * attributes *before* it is connected. The SDK reads `capture-id` and the
 * document modes when it connects, and React sets attributes on a custom
 * element after insertion — and v12's JSX typings already claim this tag name
 * for a different element.
 *
 * @see https://legacy-docs.usesmileid.com/integration-options/web-mobile-web/javascript-sdk-beta/usage
 */

type Step = "idle" | "loading" | "capture" | "sending";
type Outcome = null | { kind: "done" | "error"; message: string };

export function LegacySmileIdCapture({
  title,
  description,
  footerNote,
  onVerified,
  autoStart = false,
  withDocument = true,
}: {
  title: string;
  description: string;
  footerNote: string;
  onVerified: () => void;
  autoStart?: boolean;
  withDocument?: boolean;
}) {
  const [step, setStep] = useState<Step>(autoStart ? "loading" : "idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [config, setConfig] = useState<LegacySmileIdConfig | null>(null);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const attemptRef = useRef<string | null>(null);

  /** One submission per capture. Their review screen can publish twice. */
  const sending = useRef(false);

  /** Kicked off once. A remount must not open a second attempt. */
  const started = useRef(false);

  const fail = useCallback((message: string) => {
    sending.current = false;
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

  const submit = useCallback(
    async (captured: LegacyCapturedImage[]) => {
      if (sending.current) return;

      const attemptId = attemptRef.current;

      if (attemptId === null) {
        fail("Your session expired before that could be sent. Please start again.");

        return;
      }

      if (legacyImages(captured).length === 0) {
        fail("The camera did not capture everything we need. Please try again.");

        return;
      }

      sending.current = true;
      setStep("sending");

      const result = await submitLegacyVerificationAction(attemptId, captured);

      if (result.status === "error") {
        fail(result.message);

        return;
      }

      finish(result.message);
    },
    [fail, finish],
  );

  /*
   * The listener reads the latest `submit` through a ref, so the element is
   * not torn down and rebuilt mid-capture whenever a parent re-renders with a
   * new `onVerified`.
   */
  const submitRef = useRef(submit);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    const host = hostRef.current;

    if (step !== "capture" || host === null || config === null) return;

    const camera = document.createElement("smart-camera-web");

    camera.setAttribute("theme-color", config.theme_color);

    if (config.capture_document) {
      camera.setAttribute("capture-id", "");
      camera.setAttribute("document-capture-modes", config.document_capture_modes);
    }

    const onPublish = (event: Event) => {
      const detail = (event as CustomEvent<{ images?: LegacyCapturedImage[] }>)
        .detail;

      void submitRef.current(detail?.images ?? []);
    };

    // Their back and close controls. Not a failure — the attempt stays open.
    const onLeave = () => {
      setStep("idle");
      setOutcome(null);
    };

    camera.addEventListener(LEGACY_CAPTURE_PUBLISHED, onPublish);
    camera.addEventListener(LEGACY_CAPTURE_CANCELLED, onLeave);
    camera.addEventListener(LEGACY_CAPTURE_CLOSED, onLeave);

    host.replaceChildren(camera);

    return () => {
      camera.removeEventListener(LEGACY_CAPTURE_PUBLISHED, onPublish);
      camera.removeEventListener(LEGACY_CAPTURE_CANCELLED, onLeave);
      camera.removeEventListener(LEGACY_CAPTURE_CLOSED, onLeave);
      camera.remove();
    };
  }, [step, config]);

  const start = useCallback(async () => {
    setStep("loading");
    setOutcome(null);

    const loaded = await loadLegacySmileId();

    if (loaded === "conflict") {
      fail(
        "The identity check was updated while this page was open. Please reload the page and try again.",
      );

      return;
    }

    if (loaded === "failed") {
      fail(
        "We could not load the identity check. Check your connection and try again.",
      );

      return;
    }

    const opened = await startLegacyVerificationAction();

    if (opened.status === "error") {
      fail(opened.message);

      return;
    }

    attemptRef.current = opened.attemptId;
    sending.current = false;

    if (opened.config === null) {
      // No vendor automated: a person decides, as on the current integration.
      const recorded = await submittedVerificationAction(opened.attemptId, null);

      finish(
        (recorded.status === "success" ? recorded.message : null) ??
          "Your identity check has been recorded.",
      );

      return;
    }

    setConfig(opened.config);
    setStep("capture");
  }, [fail, finish]);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;

      // Starting an external operation on mount: loading their SDK and
      // opening an attempt against the API.
      void start();
    }
    /*
     * Keyed on `autoStart` alone, with `started` guarding re-entry: depending
     * on `step` or `outcome` would restart a failed check the instant it
     * failed, looping instead of leaving the retry to the client.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const showsIntro = !autoStart && (step === "idle" || step === "loading");

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        {config?.environment === "sandbox" && (
          <div className="flex items-start gap-3 border-b border-gold/40 bg-gold/10 px-6 py-4 text-xs leading-relaxed text-navy">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p>
              <strong className="font-medium">Test mode.</strong> This check
              runs against Smile ID&apos;s sandbox, so its verdict is not a real
              one.
            </p>
          </div>
        )}

        {showsIntro && (
          <div className="p-6 text-center sm:p-8">
            <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
            <h2 className="mt-3 font-serif text-xl text-navy">{title}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        )}

        {(step === "loading" || step === "sending") && (
          <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground sm:p-8">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            {step === "sending"
              ? "Sending your identity check…"
              : "Preparing your identity check…"}
          </p>
        )}

        {outcome && (
          <p
            role="status"
            aria-live="polite"
            className={`flex items-start justify-center gap-2 p-6 text-sm sm:p-8 ${
              outcome.kind === "done" ? "text-success" : "text-destructive"
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

        {step === "idle" && outcome?.kind !== "done" && (
          <div className="p-6 !pt-0 sm:p-8">
            {!autoStart && <CaptureGuidance withDocument={withDocument} />}

            <button
              type="button"
              onClick={() => void start()}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              {outcome?.kind === "error" ? "Try again" : "Begin identity check"}
            </button>
          </div>
        )}

        {/* Their capture, created and connected by the effect above. */}
        <div ref={hostRef} hidden={step !== "capture"} />

        {showsIntro && (
          <p className="border-t border-border bg-surface px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}
