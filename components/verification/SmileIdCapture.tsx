"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  startVerificationAction,
  submitCaptureAction,
  submittedVerificationAction,
} from "@/lib/actions/verification.client";
import {
  CAPTURE_CANCELLED,
  CAPTURE_CLOSED,
  CAPTURE_PUBLISHED,
  imagesForSubmission,
  loadSmileIdSdk,
  SANDBOX_TEST_NUMBERS,
  type CaptureIdentity,
  type CapturedImage,
  type SmileIdCaptureConfig,
} from "@/lib/smile-id/capture";

import { CaptureGuidance } from "./CaptureGuidance";

/**
 * Identity verification, captured with Smile ID's JavaScript SDK.
 *
 * ## The flow
 *
 *     start  →  <smart-camera-web>  →  our API  →  Smile ID
 *
 * A first check asks for the client's NIN before the camera opens (Biometric
 * KYC: the selfie is matched against the photograph the ID authority holds for
 * it). Their v11 SDK then runs the capture — selfie and liveness, and a
 * document only when the server asked for one (`capture-id`) — and publishes
 * base64 images. Those
 * go to **our** backend, which submits the job to Smile ID server to server;
 * the key that signs it never leaves the server. Everything that is a decision
 * — which product, whether there is a document step — arrives from the server
 * in one config object.
 *
 * ## Mounted imperatively
 *
 * The element is created with `document.createElement` and given its attributes
 * *before* it is connected. The SDK reads `capture-id` and the document modes
 * when it connects, and React sets attributes on a custom element after
 * insertion.
 *
 * @see https://legacy-docs.usesmileid.com/integration-options/web-mobile-web/javascript-sdk-beta/usage
 */

type Step = "idle" | "loading" | "identity" | "capture" | "sending";
type Outcome = null | { kind: "done" | "error"; message: string };

export function SmileIdCapture({
  title,
  description,
  footerNote,
  onVerified,
  autoStart = false,
  withDocument = true,
  withIdNumber = false,
}: {
  title: string;
  description: string;
  footerNote: string;
  onVerified: () => void;
  /**
   * Open straight into the capture, with no intro of ours.
   *
   * For a check the client has *already* asked for — pressing "Save &
   * continue" on an amendment is the request, and making them press "Begin
   * identity check" as well asks them to confirm a decision they have just
   * taken.
   */
  autoStart?: boolean;
  /** False once a client is proved: their check has no document step. */
  withDocument?: boolean;
  /** A first identity check: the guidance mentions the NIN asked for first. */
  withIdNumber?: boolean;
}) {
  const [step, setStep] = useState<Step>(autoStart ? "loading" : "idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [config, setConfig] = useState<SmileIdCaptureConfig | null>(null);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const attemptRef = useRef<string | null>(null);

  /** What Biometric KYC matches the selfie against, once the client has given it. */
  const identityRef = useRef<CaptureIdentity | null>(null);

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
    async (captured: CapturedImage[]) => {
      if (sending.current) return;

      const attemptId = attemptRef.current;

      if (attemptId === null) {
        fail("Your session expired before that could be sent. Please start again.");

        return;
      }

      if (imagesForSubmission(captured).length === 0) {
        fail("The camera did not capture everything we need. Please try again.");

        return;
      }

      sending.current = true;
      setStep("sending");

      const result = await submitCaptureAction(attemptId, captured, identityRef.current);

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
      const detail = (event as CustomEvent<{ images?: CapturedImage[] }>).detail;

      void submitRef.current(detail?.images ?? []);
    };

    // Their back and close controls. Not a failure — the attempt stays open.
    const onLeave = () => {
      setStep("idle");
      setOutcome(null);
    };

    camera.addEventListener(CAPTURE_PUBLISHED, onPublish);
    camera.addEventListener(CAPTURE_CANCELLED, onLeave);
    camera.addEventListener(CAPTURE_CLOSED, onLeave);

    host.replaceChildren(camera);

    return () => {
      camera.removeEventListener(CAPTURE_PUBLISHED, onPublish);
      camera.removeEventListener(CAPTURE_CANCELLED, onLeave);
      camera.removeEventListener(CAPTURE_CLOSED, onLeave);
      camera.remove();
    };
  }, [step, config]);

  const start = useCallback(async () => {
    setStep("loading");
    setOutcome(null);

    if (!(await loadSmileIdSdk())) {
      fail("We could not load the identity check. Check your connection and try again.");

      return;
    }

    const opened = await startVerificationAction();

    if (opened.status === "error") {
      fail(opened.message);

      return;
    }

    attemptRef.current = opened.attemptId;
    sending.current = false;

    if (opened.config === null) {
      // No vendor automated: a person decides this one. The attempt is real,
      // so it is recorded rather than shown as a broken camera.
      const recorded = await submittedVerificationAction(opened.attemptId, null);

      finish(
        (recorded.status === "success" ? recorded.message : null) ??
          "Your identity check has been recorded.",
      );

      return;
    }

    setConfig(opened.config);
    identityRef.current = null;
    // Biometric KYC asks for the number first; a recheck opens the camera.
    setStep(opened.config.id_number_required ? "identity" : "capture");
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
            {!autoStart && (
              <CaptureGuidance withDocument={withDocument} withIdNumber={withIdNumber} />
            )}

            <button
              type="button"
              onClick={() => void start()}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              {outcome?.kind === "error" ? "Try again" : "Begin identity check"}
            </button>
          </div>
        )}

        {step === "identity" && config && (
          <IdentityNumberStep
            config={config}
            onContinue={(identity) => {
              identityRef.current = identity;
              setStep("capture");
            }}
            onBack={() => setStep("idle")}
          />
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

const FIELD_LABEL = "text-[11px] font-semibold uppercase tracking-[0.16em] text-navy";
const FIELD =
  "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-navy focus:border-gold focus:outline-none";

/**
 * The number Biometric KYC matches the selfie against, asked before the camera.
 *
 * Checked here for feedback only: the pattern comes from the server, which
 * checks it again before anything reaches Smile ID. A client's own Will already
 * holds their NIN, so it is offered back rather than asked for twice.
 */
function IdentityNumberStep({
  config,
  onContinue,
  onBack,
}: {
  config: SmileIdCaptureConfig;
  onContinue: (identity: CaptureIdentity) => void;
  onBack: () => void;
}) {
  const types = config.id_types ?? [];
  const [idType, setIdType] = useState(types[0]?.code ?? "NIN_V2");
  const [idNumber, setIdNumber] = useState(config.prefill?.id_number ?? "");
  const [dob, setDob] = useState(config.prefill?.dob ?? "");
  const [error, setError] = useState<string | null>(null);

  const chosen = types.find((type) => type.code === idType) ?? types[0];
  const label = chosen?.label ?? "National Identification Number (NIN)";

  function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const number = idNumber.replace(/\s+/g, "");

    if (chosen && !new RegExp(chosen.pattern).test(number)) {
      setError("Enter your 11-digit NIN, as it appears on your NIN slip or in the NIMC app.");

      return;
    }

    setError(null);
    onContinue({ id_type: chosen?.code ?? idType, id_number: number, dob: dob || null });
  }

  return (
    <form onSubmit={proceed} noValidate className="space-y-5 p-6 text-left sm:p-8">
      <div>
        <h2 className="font-serif text-xl text-navy">Your identity number</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your selfie is matched against the photograph held on the national
          register for your NIN.
          {config.prefill?.id_number && " This is the number from your Will — check it is right."}
        </p>
      </div>

      {types.length > 1 && (
        <label className="block">
          <span className={FIELD_LABEL}>Identity number type</span>
          <select value={idType} onChange={(event) => setIdType(event.target.value)} className={FIELD}>
            {types.map((type) => (
              <option key={type.code} value={type.code}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className={FIELD_LABEL}>{label}</span>
        <input
          name="id_number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          value={idNumber}
          onChange={(event) => setIdNumber(event.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "id-number-error" : undefined}
          placeholder="11 digits"
          className={`${FIELD} font-mono tracking-wider`}
        />
      </label>

      <label className="block">
        <span className={FIELD_LABEL}>
          Date of birth{" "}
          <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
        </span>
        <input
          type="date"
          name="dob"
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          className={FIELD}
        />
      </label>

      {config.environment === "sandbox" && (
        <p className="border-l-2 border-gold bg-gold/5 px-4 py-3 text-xs leading-relaxed text-navy">
          <strong className="font-medium">Test mode:</strong> Smile ID&apos;s sandbox
          accepts only its test numbers, and refuses a real NIN. Use{" "}
          <span className="font-mono">{SANDBOX_TEST_NUMBERS.matchesYourSelfie}</span> to be
          matched against your own selfie, or{" "}
          <span className="font-mono">{SANDBOX_TEST_NUMBERS.notFound}</span> for a number
          the register does not hold.
        </p>
      )}

      {error && (
        <p id="id-number-error" role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
        >
          Continue to the camera
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-navy"
        >
          Back
        </button>
      </div>
    </form>
  );
}
