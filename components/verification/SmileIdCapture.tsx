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
  CAPTURE_BACK,
  CAPTURE_CANCELLED,
  CAPTURE_CLOSED,
  CAPTURE_PUBLISHED,
  imagesForSubmission,
  loadSmileIdSdk,
  type CapturedImage,
  type DocumentTypeOption,
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
 * A first check asks which ID the client has before the camera opens, and the
 * ID decides the product: the National ID (NIN) or BVN is Smile ID Biometric
 * KYC — a selfie matched against the photograph held for the number — and a
 * passport, driver's licence or voter's card is Document Verification, photographed or
 * uploaded after the selfie (`capture-id`, with their auto-capture). Their v11
 * SDK captures and publishes base64 images. Those
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

type Step = "idle" | "loading" | "document" | "capture" | "sending";
type Outcome = null | { kind: "done" | "error"; message: string };

export function SmileIdCapture({
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
}) {
  const [step, setStep] = useState<Step>(autoStart ? "loading" : "idle");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [config, setConfig] = useState<SmileIdCaptureConfig | null>(null);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const attemptRef = useRef<string | null>(null);

  /** The document the client chose, once they have. Read when the camera is built. */
  const documentRef = useRef<DocumentTypeOption | null>(null);

  /** The NIN, when the client chose the National ID. */
  const idNumberRef = useRef<string | null>(null);

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

      const result = await submitCaptureAction(
        attemptId,
        captured,
        documentRef.current?.code ?? null,
        idNumberRef.current,
      );

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

    const chosenId = documentRef.current;

    // A document is photographed after the selfie; the NIN and the BVN are a selfie alone.
    const capturesDocument =
      chosenId?.method === "document_verification" ||
      (config.capture_document && !chosenId?.requires_id_number);

    if (capturesDocument) {
      camera.setAttribute("capture-id", "");
      camera.setAttribute("document-capture-modes", config.document_capture_modes);
      /*
       * Their document auto-capture engine, which captures at the resolution
       * Document Verification needs (at least 600KB). Without it, laptop
       * captures reached Smile ID at about 40KB and were never processed.
       */
      camera.setAttribute("auto-capture-enabled", "true");

      // A passport's details are all on its photo page: no back to ask for.
      if (chosenId && !chosenId.has_back) {
        camera.setAttribute("hide-back-of-id", "");
      }
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
    camera.addEventListener(CAPTURE_BACK, onLeave);

    host.replaceChildren(camera);

    return () => {
      camera.removeEventListener(CAPTURE_PUBLISHED, onPublish);
      camera.removeEventListener(CAPTURE_CANCELLED, onLeave);
      camera.removeEventListener(CAPTURE_CLOSED, onLeave);
      camera.removeEventListener(CAPTURE_BACK, onLeave);
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
    documentRef.current = null;
    idNumberRef.current = null;
    // A document check asks which document first; a recheck opens the camera.
    setStep((opened.config.document_types ?? []).length > 0 ? "document" : "capture");
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
              <CaptureGuidance withDocument={withDocument} />
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

        {step === "document" && config && (
          <DocumentTypeStep
            config={config}
            onContinue={(document, idNumber) => {
              documentRef.current = document;
              idNumberRef.current = idNumber;
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


/** What each ID's number is called, for the field that asks for it. */
const NUMBER_LABELS: Record<string, string> = {
  NIN_V2: "National Identification Number (NIN)",
  BVN: "Bank Verification Number (BVN)",
};

/** Feedback only: the server checks the number again, with the same words. */
const NUMBER_ERRORS: Record<string, string> = {
  NIN_V2: "Enter your 11-digit NIN, as it appears on your National ID card or NIN slip.",
  BVN: "Enter your 11-digit Bank Verification Number (BVN).",
};

/**
 * Which ID the client will verify with, asked before the camera opens.
 *
 * The list is the server's — each ID with how Smile ID check it — and the
 * server checks the choice and any number again before anything reaches them.
 */
function DocumentTypeStep({
  config,
  onContinue,
  onBack,
}: {
  config: SmileIdCaptureConfig;
  onContinue: (document: DocumentTypeOption, idNumber: string | null) => void;
  onBack: () => void;
}) {
  const documents = config.document_types ?? [];
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const selected = documents.find((candidate) => candidate.code === chosen) ?? null;

  /*
   * Where the chosen ID's number comes from. Only `ask` shows a field: the NIN
   * on the client's own Will, or in test mode Smile ID's test number, is sent
   * by the server without being asked for.
   */
  const numberSource = selected?.number_source ?? "ask";
  const asksForNumber = selected?.requires_id_number === true && numberSource === "ask";

  function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) {
      setError("Choose how you will prove your identity.");

      return;
    }

    // Checked here for feedback only: the server checks the pattern again.
    if (asksForNumber) {
      const number = idNumber.replace(/\s+/g, "");

      if (!new RegExp(selected.id_number_pattern ?? "^[0-9]{11}$").test(number)) {
        setError(NUMBER_ERRORS[selected.code] ?? `Enter your ${selected.label} to continue.`);

        return;
      }

      setError(null);
      onContinue(selected, number);

      return;
    }

    setError(null);
    onContinue(selected, null);
  }

  return (
    <form onSubmit={proceed} noValidate className="space-y-5 p-6 text-left sm:p-8">
      <fieldset aria-describedby={error ? "document-type-error" : undefined}>
        <legend className="font-serif text-xl text-navy">Your identity</legend>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose the ID you will verify with. Your National ID or BVN is checked
          by its number and your selfie. A passport, driver&apos;s licence or
          voter&apos;s card is photographed after your selfie, or uploaded as a
          clear photo or scan.
        </p>

        {config.account_holder?.is_lawyer && (
          <p className="mt-4 rounded-xl border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-relaxed text-navy">
            This check is of you
            {config.account_holder.name ? `, ${config.account_holder.name}` : ""} —
            the account holder. Use your own ID, not a client&apos;s: your
            clients are never verified here.
          </p>
        )}

        <div className="mt-5 space-y-2">
          {documents.map((document) => (
            <label
              key={document.code}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-navy transition-colors ${
                chosen === document.code ? "border-gold bg-gold/5" : "border-border hover:border-gold/60"
              }`}
            >
              <input
                type="radio"
                name="document_type"
                value={document.code}
                checked={chosen === document.code}
                onChange={() => {
                  setChosen(document.code);
                  setError(null);
                }}
                className="h-4 w-4 shrink-0 accent-navy"
              />
              <span className="flex-1">{document.label}</span>
              {document.number_source === "will" ? (
                <span className="text-xs text-muted-foreground">From your Will</span>
              ) : document.method === "document_verification" ? (
                <span className="text-xs text-muted-foreground">Photograph</span>
              ) : null}
            </label>
          ))}
        </div>
      </fieldset>

      {selected?.requires_id_number && numberSource === "will" && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-navy">
          We will use the NIN on your Will, ending{" "}
          <span className="font-mono">{selected.number_hint}</span>, so there is
          nothing to type.
        </p>
      )}

      {selected?.method === "document_verification" && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-navy">
          After your selfie, photograph your {selected.label.toLowerCase()} in good
          light{selected.has_back ? ", front and back," : ""} or upload a clear
          photo or scan of it.
        </p>
      )}

      {asksForNumber && selected && (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy">
            {NUMBER_LABELS[selected.code] ?? selected.label}
          </span>
          <input
            name="id_number"
            autoComplete="off"
            maxLength={14}
            value={idNumber}
            onChange={(event) => {
              setIdNumber(event.target.value);
              setError(null);
            }}
            aria-invalid={error !== null}
            aria-describedby={error ? "document-type-error" : undefined}
            placeholder="11 digits"
            inputMode="numeric"
            className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-base tracking-wider text-navy focus:border-gold focus:outline-none"
          />
        </label>
      )}

      {config.environment === "sandbox" && (
        <p className="border-l-2 border-gold bg-gold/5 px-4 py-3 text-xs leading-relaxed text-navy">
          <strong className="font-medium">Test mode:</strong>{" "}
          {selected?.requires_id_number ? (
            <>
              Smile ID&apos;s sandbox refuses real numbers, so their test number,{" "}
              <span className="font-mono">{selected.number_hint ?? "00000000000"}</span>, is
              sent instead, and the result is simulated as approved.
            </>
          ) : (
            <>
              Smile ID&apos;s sandbox is used, and the result is simulated as
              approved.
            </>
          )}
        </p>
      )}

      {error && (
        <p id="document-type-error" role="alert" className="text-sm leading-relaxed text-destructive">
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
