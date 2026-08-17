"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import {
  startVerificationAction,
  submitVerificationAction,
  type CaptureConfig,
  type PublishedImage,
} from "@/lib/actions/verification.client";

/**
 * Identity capture, by Smile ID's own web component.
 *
 * ## Why a script tag and not a package
 *
 * The CDN build is a self-contained classic script — it bundles its own Preact
 * runtime and MediaPipe models and registers sixteen custom elements when it
 * runs. The npm package publishes unbundled ES modules that expect a bundler
 * to resolve their siblings, which is more machinery for the same component,
 * and it would put a megabyte of vendor code through our build for something
 * only one page uses. Loaded on demand, so nobody downloads it who never
 * reaches a verification.
 *
 * ## Why the version is pinned
 *
 * `…/js/v11/…` tracks the major version and would update itself. This script
 * runs on the page where clients photograph their passport, so a silent
 * third-party update is a supply-chain change to the most sensitive screen in
 * the product. Bumping a number here is cheap; not knowing which code ran is
 * not.
 */
const SDK_VERSION = "11.6.2";
const SDK_SRC = `https://cdn.smileidentity.com/js/v${SDK_VERSION}/smart-camera-web.js`;

/**
 * `<smart-camera-web>` for TypeScript.
 *
 * A typed alias over the tag name rather than an augmentation of the global
 * JSX namespace: React renders a string component as that element, so this is
 * the same markup with none of the reach. Only the attributes we set are
 * listed — the component observes many more, and enumerating them here would
 * be a second copy of its API, quietly drifting from the real one.
 */
type SmartCameraWebProps = React.HTMLAttributes<HTMLElement> & {
  ref?: React.Ref<HTMLElement | null>;
  "capture-id"?: string;
  "document-type"?: string;
  "partner-name"?: string;
  "policy-url"?: string;
  "theme-color"?: string;
};

const SmartCameraWeb = "smart-camera-web" as unknown as React.FC<SmartCameraWebProps>;

/** What the component hands over on `smart-camera-web.publish`. */
type PublishDetail = {
  images?: PublishedImage[];
  meta?: { libraryVersion?: string };
};

/**
 * Loads the SDK once per page, however many times this mounts.
 *
 * Kept at module scope rather than in a ref: two components mounting together
 * would otherwise each append a script tag, and the second registration of a
 * custom element throws.
 */
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (sdkPromise === null) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      // Already defined — a previous mount got there first, or the script was
      // cached and executed before this ran.
      if (window.customElements?.get("smart-camera-web")) {
        resolve();

        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SDK_SRC}"]`,
      );

      const script = existing ?? document.createElement("script");

      // Resolve on the element being *defined*, not merely on load: the script
      // registers the element as it executes, and rendering the tag before
      // that leaves an inert unknown element on screen.
      const settle = () =>
        window.customElements
          .whenDefined("smart-camera-web")
          .then(() => resolve())
          .catch(reject);

      script.addEventListener("load", settle);
      script.addEventListener("error", () =>
        reject(new Error("The identity check could not be loaded.")),
      );

      if (!existing) {
        script.src = SDK_SRC;
        script.async = true;
        document.head.appendChild(script);
      } else if (existing.dataset.loaded === "true") {
        settle();
      }

      script.dataset.loaded = "true";
    }).catch((error) => {
      // A failed load must not be cached as a permanent failure — the client's
      // next attempt should get a fresh script tag rather than this rejection.
      sdkPromise = null;

      throw error;
    });
  }

  return sdkPromise;
}

type Phase = "idle" | "loading" | "capturing" | "submitting" | "done" | "error";

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
  /**
   * Which ID the client said they would photograph. Advisory — it shapes the
   * capture frame the component draws, and the server decides whether a
   * document is captured at all.
   */
  documentType?: string | null;
  onVerified: () => void;
}) {
  const hostRef = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [capture, setCapture] = useState<CaptureConfig | null>(null);

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
     * The attempt is opened after the SDK is loaded, so a client on a blocked
     * network or an unsupported browser does not spend one on a check they
     * were never going to be able to start.
     */
    const started = await startVerificationAction(documentType);

    if (started.status === "error") {
      setPhase("error");
      setMessage(started.message);

      return;
    }

    setAttemptId(started.attemptId);
    setCapture(started.capture);
    setPhase("capturing");
  }, [documentType]);

  const publish = useCallback(
    async (detail: PublishDetail) => {
      const images = detail.images ?? [];

      if (attemptId === null) return;

      setPhase("submitting");

      const result = await submitVerificationAction({
        attemptId,
        images,
        libraryVersion: detail.meta?.libraryVersion ?? null,
        documentType,
      });

      if (result.status === "success") {
        setPhase("done");
        setMessage(result.message ?? "Verification complete.");
        onVerified();

        return;
      }

      setPhase("error");
      setMessage(
        result.message ?? "We could not verify your identity. Please try again.",
      );
    },
    [attemptId, documentType, onVerified],
  );

  /*
   * Custom events, bound by hand.
   *
   * React's `on*` props only reach known DOM events, so a JSX
   * `onSmart-camera-web.publish` would silently never fire. Bound on the host
   * element instead, and rebound whenever the handler changes so it never
   * closes over a stale attempt id.
   */
  useEffect(() => {
    const host = hostRef.current;

    if (host === null || phase !== "capturing") return;

    const onPublish = (event: Event) => {
      void publish((event as CustomEvent<PublishDetail>).detail ?? {});
    };

    const onCancelled = () => {
      setPhase("idle");
      setAttemptId(null);
    };

    host.addEventListener("smart-camera-web.publish", onPublish);
    host.addEventListener("smart-camera-web.cancelled", onCancelled);
    host.addEventListener("smart-camera-web.close", onCancelled);

    return () => {
      host.removeEventListener("smart-camera-web.publish", onPublish);
      host.removeEventListener("smart-camera-web.cancelled", onCancelled);
      host.removeEventListener("smart-camera-web.close", onCancelled);
    };
  }, [phase, publish]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        <div className="p-6 sm:p-8">
          {phase !== "capturing" && (
            <div className="text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-gold" />
              <h2 className="mt-3 font-serif text-xl text-navy">{title}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          )}

          {phase === "capturing" && capture !== null && (
            /*
             * The component sizes itself to its container — its own styles are
             * `height: 100%` on the host — so this box is what decides how much
             * room the camera gets.
             */
            <div className="h-[32rem] w-full">
              <SmartCameraWeb
                ref={hostRef}
                // Presence, not value: the component reads `hasAttribute`, so
                // any string turns document capture on.
                {...(capture.document ? { "capture-id": "true" } : {})}
                {...(capture.document_type
                  ? { "document-type": capture.document_type }
                  : {})}
                partner-name={capture.partner_name}
                policy-url={capture.policy_url}
                // The editorial navy, so the vendor's screens do not arrive as
                // a differently-branded interruption in the middle of ours.
                theme-color="#0f1e3d"
              />
            </div>
          )}

          {phase === "loading" && (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              Preparing your identity check…
            </p>
          )}

          {phase === "submitting" && (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              Checking what you captured…
            </p>
          )}

          {message && phase !== "capturing" && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-6 flex items-start justify-center gap-2 text-sm ${
                phase === "done" ? "text-success" : "text-destructive"
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

        {phase !== "capturing" && (
          <p className="border-t border-border bg-surface px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}
