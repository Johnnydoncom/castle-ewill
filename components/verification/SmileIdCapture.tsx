"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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
      /*
       * Every document attribute belongs **here**, not on the nested element.
       *
       * `<smart-camera-web>` renders its own `<document-capture-screens>` into
       * its shadow root from its own attributes — the child written in our JSX
       * is never slotted and never read. `document-capture-modes` sat there for
       * a release, which is why "upload a file" never appeared and people were
       * stuck photographing a passport with a laptop webcam.
       */
      "smart-camera-web": CustomElementProps & {
        /* Presence, not value: `hasAttribute("capture-id")` turns on the document step. */
        "capture-id"?: string;
        "document-type"?: string;
        "document-capture-modes"?: string;
        "hide-back-of-id"?: string;
        /*
         * Enhanced SmartSelfie active liveness. Read by the wrapper and
         * forwarded to `<selfie-capture-screens>` as `use-strict-mode="true"`;
         * the value matters here, since the wrapper treats the string
         * `"false"` as off.
         */
        "use-strict-mode"?: string;
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

/**
 * Which document the client will present.
 *
 * `id_type` is optional for Document Verification — omit it and Smile ID
 * classifies whatever it is given. Asking anyway buys two things: their
 * capture screens frame a passport page differently from a card, and the
 * answer is checked against the document the client said they held rather
 * than inferred from the photograph.
 */
function DocumentChoice({
  types,
  onChosen,
}: {
  types: { value: string; label: string }[];
  onChosen: (value: string) => void;
}) {
  return (
    <div className="mt-2">
      <p className="text-center text-sm text-muted-foreground">
        Which document will you show?
      </p>

      <div className="mt-4 space-y-2">
        {types.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChosen(type.value)}
            className="flex w-full items-center justify-between gap-3 border border-border bg-surface px-5 py-4 text-left text-sm text-navy transition-colors hover:border-gold hover:bg-gold/5"
          >
            <span>{type.label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        You can photograph it or upload a clear scan.
      </p>
    </div>
  );
}

/**
 * What the camera step actually wants, said before it opens.
 *
 * Smile ID's capture will not start until the face sits inside its oval at
 * between 35% and 62% of the frame — a band hard-coded in their component —
 * and until then it answers with one instruction after another: "move your
 * device higher", "lower", "right". Nothing on that screen says what it is
 * waiting for, so from the outside it reads as a check that has hung.
 *
 * We cannot widen the band and cannot change their screen. We can say what it
 * is looking for beforehand, which turns a loop of orders into a thing with a
 * shape: get this right and it starts.
 *
 * The last line is the escape hatch. Their capture enables its own button after
 * ten seconds of not being satisfied — `CAPTURE_FALLBACK_TIMEOUT_MS` in the
 * package — and a client who does not know that will sit there indefinitely
 * doing as they are told.
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
   * The session, accumulated across four separate events.
   *
   * Refs rather than state: these are read inside listeners bound once, and a
   * closure over state would still be looking at the render that bound it.
   * None of them drives the UI.
   */
  /** The element itself — `smart-camera-web.publish` dispatches on it, not on `window`. */
  const cameraRef = useRef<HTMLElement | null>(null);
  const attemptRef = useRef<string | null>(null);

  /*
   * Which document the client said they would show. Sent as `id_type`.
   *
   * State, not a ref, because it decides what is rendered — the attributes
   * that frame the capture are read off it.
   */
  const [idType, setIdType] = useState<string | null>(null);
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

      // Decided by the server: a client who has already proved who they are is
      // checked against that identity rather than against a document.
      const isRecheck = current.product === "smart_selfie_authentication";

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

      if (!isRecheck && !front) {
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

      /*
       * Only the document check carries a document.
       *
       * A returning client is asked for a face and nothing else — their
       * identity was proved once and does not need proving again — and the
       * authentication endpoint refuses a document part it never asked for.
       */
      if (!isRecheck) {
        body.append("document", toJpegFile(front!.image, "document-front.jpg"));
      }

      // Only when one was actually published: plenty of IDs have no back, and
      // an empty part is its own error.
      const back = isRecheck
        ? undefined
        : all.find((i) => i.image_type_id === IMAGE_TYPE.documentBack);

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

      /*
       * Identifies the enrolled person the face is matched against. Required
       * by the authentication endpoint and harmless on the document one, so it
       * is sent either way rather than branched on.
       */
      body.append("user_id", current.user_id);

      /*
       * Optional for this product — omit it and their server auto-classifies —
       * but the client told us which document they were holding, and passing
       * it through means the answer is checked against that rather than
       * inferred from a photograph.
       */
      if (idType) {
        body.append("id_type", idType);
      }
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
       * The enrolment, from the same capture.
       *
       * `/v3/authentication` — every future check that this is still the same
       * person — matches a face against an identity registered under this user
       * id. Nothing registers one unless we ask, so the frames the client has
       * just provided are submitted a second time to `/v3/registration`. One
       * capture, two jobs, and no second appointment with the camera.
       *
       * Deliberately after the verification and deliberately swallowed: the
       * identity check has already succeeded, and failing it now because an
       * enrolment did not take would refuse somebody for a convenience they
       * did not ask for. A client who ends up unenrolled is asked for a
       * document check again later, which is recoverable; a client refused
       * here is stuck.
       */
      if (current.enrolment) {
        try {
          const enrolBody = new FormData();

          enrolBody.append("selfie_image", toJpegFile(selfie.image, "selfie.jpg"));

          all
            .filter((i) => i.image_type_id === IMAGE_TYPE.liveness)
            .forEach((frame, i) => {
              enrolBody.append(
                "liveness_images",
                toJpegFile(frame.image, `liveness-${i}.jpg`),
              );
            });

          enrolBody.append(
            "consent",
            JSON.stringify({
              ...(consentRef.current ?? { granted: true }),
              notice_language: current.consent.notice_language,
              notice_privacy_policy_url: current.consent.notice_privacy_policy_url,
            }),
          );
          enrolBody.append("user_details", JSON.stringify(current.user_details));
          enrolBody.append("callback_url", current.callback_url);
          enrolBody.append(
            "partner_params",
            JSON.stringify(current.partner_params),
          );

          const enrolResponse = await fetch(current.enrolment.endpoint, {
            method: "POST",
            headers: {
              "smileid-token": current.enrolment.token,
              // How Smile ID learns which id to enrol this face under. Omit it
              // and they mint one of their own, which is an identity we could
              // never ask about again.
              "User-ID": current.user_id,
              Accept: "application/json",
            },
            body: enrolBody,
          });

          if (enrolResponse.status === 202) {
            const enrolled = (await enrolResponse.json().catch(() => ({}))) as {
              job_id?: string;
            };

            await enrolledAction(enrolled.job_id ?? null);
          } else {
            console.error(
              "[smile-id] enrolment refused",
              enrolResponse.status,
              await enrolResponse.text().catch(() => ""),
            );
          }
        } catch (error) {
          console.error("[smile-id] enrolment failed", error);
        }
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
    [fail, finish, idType],
  );

  /*
   * One set of listeners, bound once, on `window` — where their documentation
   * says these dispatch.
   */
  useEffect(() => {
    const onConsentGranted = (event: Event) => {
      consentRef.current = (event as CustomEvent<ConsentDetail>).detail;

      /*
       * A recheck skips the document question entirely — there is no document
       * in it, so asking which one somebody will show is asking about
       * something that is not going to happen.
       */
      setStep(configRef.current?.product === "smart_selfie_authentication"
        ? "capture"
        : "document");
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

    /*
     * Why the capture behaved as it did.
     *
     * Enhanced SmartSelfie runs head-pose detection on the device, from models
     * it fetches at runtime (`web-models.smileidentity.com`: MediaPipe's WASM,
     * a face-landmarker task, OpenCV). When that cannot load, it says so on
     * these two events and then either offers a retry — in strict mode, whose
     * whole mechanic *is* that detection — or drops to an interval capture with
     * no prompts at all.
     *
     * Both are indistinguishable from "the guided check isn't working" at the
     * far end of a support conversation, so they are recorded here. `version`
     * is `1.0.0` when detection is live and `0.0.1` when it fell back.
     */
    const onLivenessVersion = (event: Event) => {
      const detail = (event as CustomEvent<{ version?: string }>).detail;

      console.info("[smile-id] active liveness version", detail?.version);
    };

    const onFallbackReason = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: string }>).detail;

      console.error(
        "[smile-id] face detection unavailable — the guided prompts cannot run",
        detail?.reason,
      );
    };

    camera?.addEventListener(
      "metadata.active-liveness-version",
      onLivenessVersion,
    );
    camera?.addEventListener(
      "metadata.mediapipe-fallback-reason",
      onFallbackReason,
    );
    camera?.addEventListener("smart-camera-web.publish", onCapture);
    camera?.addEventListener("smart-camera-web.close", onCameraClosed);

    return () => {
      window.removeEventListener("smileid-consent.granted", onConsentGranted);
      window.removeEventListener("smileid-consent.denied", onConsentDenied);
      window.removeEventListener(
        "document-capture-screens.publish",
        onDocuments,
      );
      camera?.removeEventListener(
        "metadata.active-liveness-version",
        onLivenessVersion,
      );
      camera?.removeEventListener(
        "metadata.mediapipe-fallback-reason",
        onFallbackReason,
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

  /*
   * Whether this is a face-only recheck, decided by the server.
   *
   * Identity is proved once. A returning client is matched against the
   * identity they already proved, so nothing here mounts a document step or
   * asks which ID they will show.
   */
  const isRecheck = config?.product === "smart_selfie_authentication";
  const showsIntro = step === "idle" || step === "loading";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        {/*
          Said plainly, at the top, whenever it is on.
          
          The sandbox judges the name rather than the photographs, so a test
          run submits as somebody fictional. A test run that looks exactly like
          a real one is how a made-up name ends up in a support conversation.
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

          {config && step === "document" && (
            <DocumentChoice
              types={config.id_types}
              onChosen={(value) => {
                setIdType(value);
                setStep("capture");
              }}
            />
          )}

          {config && step === "capture" && (
            <smart-camera-web
              ref={cameraRef}
              theme-color={theme}
              /*
                `capture-id` is what turns the document step on, so a recheck
                leaves it off entirely: a client who has already proved who
                they are is asked for a face and nothing else. With it set,
                they would be walked through photographing their ID again —
                which is what "I was asked to do KYC twice" was.
              */
              capture-id={isRecheck ? undefined : ""}
              document-type={isRecheck ? undefined : (idType ?? undefined)}
              /*
                On the wrapper, which is the only place it is read — see the
                note on its attribute typing above. This is what puts "upload a
                file" beside "take a photograph", so a passport can be sent as
                a scan rather than fought with on a laptop webcam.
              */
              document-capture-modes={
                isRecheck ? undefined : config.document_capture_modes
              }
              /* A passport is one page; asking for its back is a dead end. */
              hide-back-of-id={
                !isRecheck && idType === "PASSPORT" ? "" : undefined
              }
              /*
                The difference between "look at the camera" and being told what
                to do. Enhanced SmartSelfie prompts a randomised head turn and
                gates the capture on following it; without it the capture waits
                for a smile and never says so, which is how somebody ends up
                staring at their own face wondering what is expected.
              */
              use-strict-mode={config.strict_liveness ? "true" : undefined}
            >
              {/*
                Nested, as their setup page shows, and `capture-id` is what
                turns the document step on: without the attribute the wrapper
                publishes straight after the selfie and the job goes out with
                no document in it — `this.captureId ? setActiveScreen(document)
                : publish()`, read out of the package.
              */}
              <document-capture-screens
                theme-color={theme}
                document-capture-modes={
                isRecheck ? undefined : config.document_capture_modes
              }
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
