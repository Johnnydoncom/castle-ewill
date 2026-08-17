"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import {
  startVerificationAction,
  submittedVerificationAction,
  type SmileIdConfig,
} from "@/lib/actions/verification.client";

/**
 * Identity verification, run by Smile ID's hosted web flow.
 *
 * ## What this component does, and what it deliberately does not
 *
 * It asks our API to open an attempt and mint a **web token**, then calls
 * `window.SmileIdentity({ token, … })`. Everything after that belongs to Smile
 * ID: their screens, their camera handling, their liveness checks, and their
 * upload — the captures go from the client's browser to Smile ID directly and
 * never touch our servers. `onSuccess` means the job was accepted (202), not
 * that it passed; the verdict arrives on our webhook.
 *
 * An earlier revision embedded Smile ID's `smart-camera-web` component and
 * relayed base64 frames through our API. That is their *other* integration —
 * the one for partners doing their own server-to-server submission — and it
 * put us in the middle of the most sensitive images in the product for no
 * benefit. This is the integration their documentation prescribes for a web
 * app, and the one their example shows.
 *
 * ## The script
 *
 * A plain tag, loaded on demand, exactly as documented. It defines
 * `window.SmileIdentity` and opens an iframe on `links.usesmileid.com`.
 */
const SDK_SRC = "https://cdn.smileidentity.com/inline/v1/js/script.min.js";

/**
 * The hosted flow's configuration, as their documentation defines it.
 *
 * Deliberately not a copy of every option they accept — only what we set. The
 * rest is theirs to default.
 */
type SmileIdentityOptions = {
  token: string;
  product: string;
  callback_url?: string;
  environment: "sandbox" | "production";
  partner_details: {
    partner_id: string;
    name: string;
    logo_url: string;
    policy_url: string;
    theme_color: string;
  };
  onSuccess?: () => void;
  onClose?: () => void;
  onError?: (error: unknown) => void;
};

declare global {
  interface Window {
    SmileIdentity?: (options: SmileIdentityOptions) => void;
  }
}

/**
 * Loads the script once per page, however many times this mounts.
 *
 * Module scope rather than a ref: two mounts would otherwise each append a tag
 * and race to define the same global.
 */
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof window.SmileIdentity === "function") return Promise.resolve();

  if (sdkPromise === null) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SDK_SRC}"]`,
      );

      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("The identity check could not be loaded.")),
        );

        // Already executed — a previous mount got there first.
        if (typeof window.SmileIdentity === "function") resolve();

        return;
      }

      const script = document.createElement("script");

      script.src = SDK_SRC;
      script.async = true;
      script.addEventListener("load", () => resolve());
      script.addEventListener("error", () =>
        reject(new Error("The identity check could not be loaded.")),
      );

      document.head.appendChild(script);
    }).catch((error) => {
      // A failed load must not be cached as a permanent failure — the client's
      // next attempt should get a fresh tag rather than this rejection.
      sdkPromise = null;

      throw error;
    });
  }

  return sdkPromise;
}

type Phase = "idle" | "loading" | "running" | "recording" | "done" | "error";

export function SmileIdCapture({
  title,
  description,
  footerNote,
  documentType,
  onVerified,
}: {
  title: string;
  description: string;
  footerNote: string;
  /** Which ID the client said they would show. Advisory — the server decides the product. */
  documentType?: string | null;
  onVerified: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  /*
   * The attempt, held in a ref rather than state.
   *
   * Smile ID's callbacks fire from inside their iframe long after `start` has
   * returned, and a closure over state would still be looking at the render
   * that opened the flow.
   */
  const attemptRef = useRef<string | null>(null);

  const reportSubmitted = useCallback(async () => {
    const attemptId = attemptRef.current;

    if (attemptId === null) return;

    setPhase("recording");

    /*
     * Only tells our own API the job was accepted. It is not the verdict —
     * that arrives on our webhook — and its purpose is to stop this client's
     * dashboard offering a retry for a check already running.
     */
    const result = await submittedVerificationAction(attemptId);

    setPhase("done");
    setMessage(
      result.status === "success"
        ? (result.message ??
          "Your identity check has been submitted. We will email you as soon as it is confirmed.")
        : "Your identity check was submitted. We will email you as soon as it is confirmed.",
    );

    onVerified();
  }, [onVerified]);

  const open = useCallback(
    (config: SmileIdConfig) => {
      if (typeof window.SmileIdentity !== "function") {
        setPhase("error");
        setMessage(
          "We could not load the identity check. Check your connection and try again.",
        );

        return;
      }

      setPhase("running");

      window.SmileIdentity({
        token: config.token,
        product: config.product,
        environment: config.environment,
        partner_details: config.partner_details,
        onSuccess: () => {
          void reportSubmitted();
        },
        onClose: () => {
          // Closing is not failing. The attempt stays open and the client can
          // start again without being told anything went wrong.
          setPhase("idle");
          setMessage(null);
        },
        onError: (error: unknown) => {
          setPhase("error");
          setMessage(
            typeof error === "string" && error.includes("ConsentDenied")
              ? "The check cannot go ahead without your consent. You can start it again when you are ready."
              : "The identity check could not be completed. Please try again.",
          );
        },
      });
    },
    [reportSubmitted],
  );

  const start = useCallback(async () => {
    setPhase("loading");
    setMessage(null);

    try {
      await loadSdk();
    } catch {
      setPhase("error");
      setMessage(
        "We could not load the identity check. Check your connection and try again.",
      );

      return;
    }

    /*
     * The attempt is opened after the script is loaded, so a client on a
     * blocked network does not spend one on a check they were never going to
     * be able to start.
     */
    const started = await startVerificationAction(documentType);

    if (started.status === "error") {
      setPhase("error");
      setMessage(started.message);

      return;
    }

    attemptRef.current = started.attemptId;

    if (started.smileId === null) {
      /*
       * No vendor configured. The attempt is real and a person will decide it,
       * so the client is told that rather than shown a broken camera.
       */
      await reportSubmitted();

      return;
    }

    open(started.smileId);
  }, [documentType, open, reportSubmitted]);

  // Nothing to unmount: the flow lives in Smile ID's own overlay.
  useEffect(() => () => undefined, []);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        <div className="p-6 sm:p-8 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
          <h2 className="mt-3 font-serif text-xl text-navy">{title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {(phase === "loading" ||
            phase === "running" ||
            phase === "recording") && (
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                {phase === "loading"
                  ? "Preparing your identity check…"
                  : phase === "running"
                    ? "Follow the steps in the window that opened."
                    : "Recording your submission…"}
              </p>
            )}

          {message && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-6 flex items-start justify-center gap-2 text-sm ${phase === "done" ? "text-success" : "text-destructive"
                }`}
            >
              {phase === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="text-left">{message}</span>
            </p>
          )}

          {(phase === "idle" || phase === "error") && (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              {phase === "error" ? "Try again" : "Begin identity check"}
            </button>
          )}
        </div>
        <p className="border-t border-border bg-surface px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
          {footerNote}
        </p>
      </div>
    </div>
  );
}
