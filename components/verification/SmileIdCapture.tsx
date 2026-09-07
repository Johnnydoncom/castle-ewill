"use client";

import { useCallback, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  enrolledAction,
  startVerificationAction,
  submittedVerificationAction,
  type SmileIdConfig,
  type SmileIdResult,
} from "@/lib/actions/verification.client";

/**
 * The identity check, run by Smile ID's hosted flow.
 *
 * ## Why the hosted flow rather than the web components
 *
 * Both are Smile ID's. The web components hand you the screens and leave the
 * job submission — consent, user details, document capture, selfie capture,
 * building a multipart body and posting it — to you. That is roughly six
 * hundred lines of our code standing between a client and a vendor who wrote
 * the same thing already, and every one of them is ours to get wrong: the
 * document attributes that belonged on the wrapper rather than the child, the
 * publish event that fires on the element rather than on `window`, the
 * liveness frames that must repeat under one field name.
 *
 * `window.SmileIdentity(config)` is the whole integration instead. It opens a
 * modal, runs its own screens, and posts the job to the V3 API with the token
 * we minted. Nothing here touches an image; nothing here builds a request.
 *
 * ## What we still own
 *
 * The config, all of it, from the server — see `VerificationController::
 * hostedConfig()`. Which product runs, whose identity is being checked, where
 * the verdict is sent and whether the capture is the guided one are not the
 * browser's decisions, and the token seals them.
 *
 * And the result, which is only ever a *report*. `onResult` says the job was
 * accepted; the verdict arrives on our webhook. So this records what happened
 * and lets the page poll, rather than telling anybody they passed.
 */

/** Their script registers exactly one global. */
const SDK_SRC = "https://cdn.usesmileid.com/inline/v12/js/script.min.js";

declare global {
  interface Window {
    SmileIdentity?: (config: Record<string, unknown>) => void;
  }
}

/**
 * Loads their script once per page.
 *
 * Not npm: the embed is published only as a script tag, and their setup page
 * says so. The promise is cached so two visits to this screen — a retry after
 * a failure, say — do not add a second copy of the SDK to the document.
 */
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The identity check needs a browser."));
  }

  if (window.SmileIdentity) return Promise.resolve();

  sdkPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_SRC}"]`,
    );

    const script = existing ?? document.createElement("script");

    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      // Cleared so a retry can try again rather than resolving the same
      // rejected promise for the rest of the session.
      sdkPromise = null;
      reject(new Error("The identity check script could not be loaded."));
    });

    if (!existing) {
      script.src = SDK_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return sdkPromise;
}

/**
 * Their error codes, in words a client can act on.
 *
 * Deliberately not their `message`, which is written for whoever integrated
 * the SDK — "config validation failed" is true and useless to the person
 * holding the phone.
 */
function messageFor(code: string, retryable?: boolean): string {
  switch (code) {
    case "CONSENT_DENIED":
      return "You did not agree to the identity check, so nothing was sent. We cannot release a Will without confirming who you are.";
    case "DOCUMENTS_REJECTED":
      return "Your document could not be read. Please try again with the original — good light, no glare, and all four corners in the frame.";
    case "NOT_PERMITTED":
      return "That check could not be run on our account. Please contact us — this is ours to fix, not yours.";
    case "CONFIG_INVALID":
      // Ours, and only ours: the SDK refused what the server sent it.
      return "The identity check could not be started. Please contact us if this keeps happening.";
    case "SESSION_INIT_FAILED":
    case "SUBMISSION_FAILED":
      return "The identity check was interrupted. Please check your connection and try again.";
    default:
      return retryable === false
        ? "The identity check could not be completed. Please contact us if this keeps happening."
        : "The identity check could not be completed. Please try again.";
  }
}

/**
 * What the camera step actually wants, said before it opens.
 *
 * Smile ID's capture — the same component inside their hosted modal as outside
 * it — will not start until the face sits inside its oval at between 35% and
 * 62% of the frame, a band hard-coded in their package. Until then it answers
 * with one instruction after another: "move your device higher", "lower",
 * "right". Nothing on that screen says what it is waiting for, so from the
 * outside it reads as a check that has hung.
 *
 * We cannot widen the band or edit their screen. We can say what it is looking
 * for beforehand, which turns a loop of orders into a thing with a shape: get
 * this right and it starts.
 *
 * The last line is the escape hatch. Their capture enables its own button after
 * ten seconds of not being satisfied, and a client who does not know that will
 * sit there indefinitely doing as they are told.
 */
function CaptureGuidance() {
  return (
    <div className="mt-6 border border-border bg-surface px-5 py-4 text-left">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
        Before the camera opens
      </p>

      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>
          <span className="text-navy">Fill the oval.</span> Your face needs to
          take up most of it — closer than feels natural on a laptop, about an
          arm&apos;s length on a phone.
        </li>
        <li>
          <span className="text-navy">Face a window or a lamp,</span> not away
          from one. A bright background behind you is what usually fails.
        </li>
        <li>
          <span className="text-navy">Hold still</span> once you are in frame,
          and take off a hat or sunglasses.
        </li>
        <li>
          If it keeps asking you to move the device, wait a few seconds — the
          capture button unlocks on its own, and you can start it yourself.
        </li>
      </ul>
    </div>
  );
}

type Step = "idle" | "loading" | "open";
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
  const [testMode, setTestMode] = useState<SmileIdConfig["test_mode"]>(null);

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
   * What their flow reported, recorded against our attempt.
   *
   * Never treated as a verdict. `success` means the V3 API accepted the job —
   * their own reference is explicit that the answer comes on the webhook — so
   * this stamps the attempt as submitted and lets the waiting screen take over.
   */
  const report = useCallback(
    async (attemptId: string, config: SmileIdConfig, result: SmileIdResult) => {
      if (result.status === "cancelled") {
        setStep("idle");
        setOutcome(null);

        return;
      }

      if (result.status === "failure") {
        fail(messageFor(result.error.error_code, result.error.retryable));

        return;
      }

      setStep("loading");

      /*
       * Present for a document check, absent for the SmartSelfie products —
       * their reference says so plainly, and the webhook carries the job id
       * regardless. Null is a fine answer here.
       */
      const jobId = result.value?.job_id ?? null;

      /*
       * A registration run enrols this face, which is what makes every later
       * authentication possible. Stamped before the submission is recorded,
       * and swallowed on failure: the job is with Smile ID either way, and a
       * client who ends up unenrolled is asked for a document check again
       * later, which is recoverable.
       */
      if (config.enrols) {
        try {
          await enrolledAction(jobId);
        } catch (error) {
          console.error("[smile-id] could not record the enrolment", error);
        }
      }

      const recorded = await submittedVerificationAction(attemptId, jobId);

      /*
       * Deliberately not treated as the thing that succeeded: the job is with
       * Smile ID whatever this says, so a failure here must not tell the
       * client to submit again.
       */
      finish(
        recorded.status === "success" && recorded.message
          ? recorded.message
          : "Your identity check has been submitted.",
      );
    },
    [fail, finish],
  );

  const start = useCallback(async () => {
    setStep("loading");
    setOutcome(null);

    try {
      await loadSdk();
    } catch (error) {
      console.error("[smile-id] could not load the SDK", error);

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

    if (started.smileId === null) {
      // No vendor configured: a person will decide this one. The attempt is
      // real, so it is recorded rather than shown as a broken camera.
      const recorded = await submittedVerificationAction(
        started.attemptId,
        null,
      );

      finish(
        recorded.status === "success" && recorded.message
          ? recorded.message
          : "Your identity check has been recorded.",
      );

      return;
    }

    const config = started.smileId;

    setTestMode(config.test_mode);

    if (!window.SmileIdentity) {
      fail(
        "We could not load the identity check. Check your connection and try again.",
      );

      return;
    }

    setStep("open");

    /*
     * Their modal is made `position: absolute` by our stylesheet so a short
     * window can scroll to the bottom of it — see the note in `globals.css`.
     * Absolute means it sits at the top of the document rather than the top of
     * the viewport, so a client who had scrolled down would otherwise open the
     * check and see their own page.
     */
    window.scrollTo({ top: 0, behavior: "auto" });

    /*
     * Passed through as the server composed it, with two exceptions that are
     * the browser's by nature: the callbacks.
     *
     * `id_selection` is omitted rather than sent as null on a SmartSelfie run
     * — that flow has no document step, and their validator refuses options it
     * has no screen for.
     */
    window.SmileIdentity({
      token: config.token,
      product: config.product,
      callback_url: config.callback_url,
      environment: config.environment,
      partner_details: config.partner_details,
      consent_information: config.consent_information,
      user_details: config.user_details,
      partner_params: config.partner_params,
      document_capture_modes: config.document_capture_modes,
      ...(config.id_selection ? { id_selection: config.id_selection } : {}),

      /*
       * Enhanced SmartSelfie™: the capture that says what it wants.
       *
       * Randomised head-turn prompts, one at a time, gated on following them.
       * Without it the capture waits for a smile and mentions it nowhere,
       * which is how people ended up staring at their own face wondering what
       * was expected of them.
       */
      use_strict_mode: config.use_strict_mode,

      /*
       * Assisted capture: a switch-camera control, so somebody helping can
       * turn the device round and use the rear camera on the person in front
       * of them. Ignored by their flow while strict mode is on, which is why
       * the two are sent as the server decided them rather than merged here.
       */
      allow_agent_mode: config.allow_agent_mode,

      onResult: (result: SmileIdResult) => {
        void report(started.attemptId, config, result);
      },
    });
  }, [fail, finish, report]);

  const showsIntro = step !== "open";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        {/*
          Said plainly, at the top, whenever it is on.

          The sandbox judges the name rather than the photographs, so a test run
          submits as somebody fictional. A test run that looks exactly like a
          real one is how a made-up name ends up in a support conversation.
        */}
        {testMode && (
          <div className="flex items-start gap-3 border-b border-gold/40 bg-gold/10 px-6 py-4 text-xs leading-relaxed text-navy">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p>
              <strong className="font-medium">Test mode.</strong> Submitting as{" "}
              {testMode.user_details.given_names}{" "}
              {testMode.user_details.last_name} — not you. {testMode.describes}.
            </p>
          </div>
        )}

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

          {/*
            Their modal covers the page while it runs, so this only has to
            explain the page behind it — and to leave a way back for a client
            who closed the modal without finishing.
          */}
          {step === "open" && (
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Follow the steps in the identity check window. It will close by
              itself when you are done.
            </p>
          )}

          {outcome && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-6 flex items-start justify-center gap-2 text-sm ${
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

          {step === "idle" && <CaptureGuidance />}

          {step === "idle" && (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              {outcome?.kind === "error" ? "Try again" : "Begin identity check"}
            </button>
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
