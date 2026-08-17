"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2 } from "lucide-react";

import {
  startVerificationAction,
  submitVerificationAction,
} from "@/lib/actions/verification.client";
import { idleState } from "@/lib/actions/state";

import {
  baselineFrom,
  type FaceBaseline,
  satisfies,
  THRESHOLD,
  eyeAspectRatio,
  CHALLENGE_PROMPTS,
  type ChallengeName,
  type Point,
} from "@/lib/verification/landmarks";

/**
 * Active liveness challenge.
 *
 * MediaPipe's Face Landmarker runs in the browser and reports a 468-point mesh
 * per frame; the geometry in `lib/verification/landmarks.ts` decides whether a
 * challenge has been met.
 *
 * This is a user-experience layer and a cheap first filter, not anti-spoofing.
 * Anyone willing to bypass the JavaScript can post to the endpoint directly,
 * which is why the server records the capture and either an automated provider
 * or a human makes the actual decision.
 */

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Phase = "idle" | "loading" | "running" | "submitting" | "done" | "error";

/**
 * MediaPipe's WASM runtime (Emscripten-compiled TFLite/absl/XNNPACK) writes
 * its own diagnostic logging straight to `console.error`/`console.warn`,
 * with no public option on `FaceLandmarker` to redirect it — it is a
 * property of the compiled module, not of this library's TS API. Next's dev
 * overlay treats any `console.error` call during the page's lifetime as a
 * crash and pops up over the camera view, so routine startup diagnostics —
 * "delegate created", "GL context initialised", "graph running" — read as a
 * broken feature.
 *
 * Confirmed by directly capturing this library's actual console output
 * (Playwright, both the `GPU` delegate this component requests and a `CPU`
 * probe to force the fallback path) rather than assumed from the one
 * message text a bug report happened to quote — MediaPipe logs through (at
 * least) two distinct native formats, neither of which is a JavaScript
 * `Error`:
 *
 *  - absl/glog-style: a level letter + 4-digit date + timestamp, e.g.
 *    `W0804 20:16:36.148999 2186832 face_landmarker_graph.cc:180] ...`.
 *    `I`/`W` observed in practice; deliberately not `E`/`F` (error/fatal) —
 *    if the module ever logs a *genuine* failure this way, it must still
 *    reach the console and this filter must not hide it.
 *  - Plain level-prefixed: `INFO: Created TensorFlow Lite XNNPACK delegate
 *    for CPU.` — TFLite's own delegate-creation logger.
 *  - A short list of specific benign lines with neither prefix, e.g.
 *    `Graph successfully started running.`, seen directly in the capture.
 *
 * Matching on these observed shapes (not the exact sentence) is what keeps
 * this from silently breaking the next time MediaPipe changes its wording —
 * the shape of "this is the native logger talking", not today's phrasing,
 * is the durable signal.
 */
const GLOG_INFO_OR_WARNING = /^[IW]\d{4}\s+\d{2}:\d{2}:\d{2}\.\d+/;
const PLAIN_INFO_OR_WARNING_PREFIX = /^(INFO|WARNING):/i;
const KNOWN_BENIGN_MEDIAPIPE_LINES =
  /graph successfully started running\.?$/i;

function isBenignWasmLog(args: unknown[]): boolean {
  const first = args[0];
  if (typeof first !== "string") return false;

  const text = first.trim();

  return (
    GLOG_INFO_OR_WARNING.test(text) ||
    PLAIN_INFO_OR_WARNING_PREFIX.test(text) ||
    KNOWN_BENIGN_MEDIAPIPE_LINES.test(text)
  );
}

export function LivenessCheck({
  onVerified,
  title = "Identity check",
  description = "Before your Will can be submitted we need to confirm it is really you. You will be asked to perform a few short movements on camera.",
  footerNote = "The image captured is encrypted and stored in your vault. It is used only to confirm your identity against the ID document you uploaded.",
}: {
  onVerified?: () => void;
  title?: string;
  description?: string;
  footerNote?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  // Holds the real `console.error`/`console.warn` while MediaPipe's WASM
  // module is loaded and running, so `restoreConsole()` can put them back
  // exactly as they were — every other console message, including a
  // genuine error thrown anywhere else on the page, passes through
  // unchanged the entire time.
  const originalConsoleRef = useRef<{
    error: typeof console.error;
    warn: typeof console.warn;
  } | null>(null);

  /*
   * The client's resting face, measured before the first gesture is judged.
   *
   * Smiling and opening the mouth used to be compared against fixed ratios,
   * which no ordinary face could reach — so those two challenges failed for
   * everybody who did exactly what was asked. They are judged against this
   * instead: a smile is wider than *your own* resting mouth.
   */
  const baselineRef = useRef<FaceBaseline | null>(null);
  const baselineSamplesRef = useRef<Array<{ x: number; y: number }[]>>([]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeName[]>([]);
  const [completed, setCompleted] = useState<ChallengeName[]>([]);

  // Blink needs open → closed → open across frames, so it is tracked here
  // rather than inferred from a single frame.
  /*
   * The liveness sequence.
   *
   * Smile ID's Document Verification endpoint requires six to eight stills
   * taken *across* the challenge, not one frame at the end — a single image
   * cannot evidence movement, which is the whole point of the check. Frames
   * are collected as the challenges are satisfied and while they are being
   * attempted, so the sequence shows the face actually moving.
   *
   * Held in a ref rather than state: this is written from inside a
   * requestAnimationFrame loop, and re-rendering the component on every
   * captured frame would fight the loop for the main thread.
   */
  const sequenceRef = useRef<Blob[]>([]);
  const lastFrameAtRef = useRef(0);

  const blinkStateRef = useRef<{ sawClosed: boolean; observed: boolean }>({
    sawClosed: false,
    observed: false,
  });

  const restoreConsole = useCallback(() => {
    if (!originalConsoleRef.current) return;
    console.error = originalConsoleRef.current.error;
    console.warn = originalConsoleRef.current.warn;
    originalConsoleRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    restoreConsole();
  }, [restoreConsole]);

  useEffect(() => cleanup, [cleanup]);

  /**
   * Grabs one frame.
   *
   * `scale` exists because the selfie and the sequence frames are not the same
   * thing. Smile ID's account configuration asks for a 480x640 selfie at
   * quality 95 and 240x320 liveness frames at quality 80 — the sequence is
   * evidence of movement, not of appearance, and sending seven full-size
   * stills would multiply the upload for no gain.
   */
  const capture = useCallback(
    (scale = 1, quality = 0.9): Promise<Blob | null> => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return Promise.resolve(null);

      canvas.width = Math.max(Math.round(video.videoWidth * scale), 1);
      canvas.height = Math.max(Math.round(video.videoHeight * scale), 1);
      const context = canvas.getContext("2d");
      if (!context) return Promise.resolve(null);

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality),
      );
    },
    [],
  );

  const finish = useCallback(
    async (done: ChallengeName[], id: string) => {
      setPhase("submitting");
      cleanup();

      const blob = await capture();
      if (!blob) {
        setPhase("error");
        setMessage("We could not capture an image. Please try again.");
        return;
      }

      const formData = new FormData();
      formData.set("attemptId", id);
      formData.set("capture", new File([blob], "capture.jpg", { type: "image/jpeg" }));
      for (const challenge of done) formData.append("completed", challenge);

      /*
       * The sequence. Capped at eight — more is rejected outright by the
       * endpoint — and sent oldest first so it reads as the movement it was.
       *
       * Sent even when short: the server decides what a given provider needs,
       * and a deployment on manual review needs none of this. Silently
       * withholding a partial sequence would turn a clear "the camera did not
       * capture enough" into a confusing generic refusal.
       */
      for (const [index, frame] of sequenceRef.current.slice(0, 8).entries()) {
        formData.append(
          "liveness[]",
          new File([frame], `liveness-${index}.jpg`, { type: "image/jpeg" }),
        );
      }

      const result = await submitVerificationAction(idleState, formData);

      if (result.status === "success") {
        setPhase("done");
        setMessage(result.message ?? "Verification complete.");
        onVerified?.();
      } else {
        setPhase("error");
        setMessage(result.message ?? "Verification failed. Please try again.");
      }
    },
    [capture, cleanup, onVerified],
  );

  const start = useCallback(async () => {
    setPhase("loading");
    setMessage(null);
    setCompleted([]);
    sequenceRef.current = [];
    lastFrameAtRef.current = 0;
    blinkStateRef.current = { sawClosed: false, observed: false };

    const started = await startVerificationAction();

    if (started.status === "error") {
      setPhase("error");
      setMessage(started.message);
      return;
    }

    /*
     * Narrowed to consts here, not read off `started` later.
     *
     * `started` is a `let` holding a union, and TypeScript discards the
     * narrowing above once it is referenced inside the animation-frame closure
     * — a closure could in principle see a reassigned value. Capturing both
     * fields now keeps the types honest and the intent obvious.
     */
    const attemptId = started.attemptId;
    const issued = started.challenges.map((c) => c.name as ChallengeName);

    setChallenges(issued);

    try {
      // Installed before the WASM module loads and restored in `cleanup()`
      // — covering delegate creation *and* every `detectForVideo` call in
      // the tick loop below, since the CPU-fallback notice this filters
      // fires from inside the compiled module on whichever call actually
      // triggers it, not necessarily the first.
      if (!originalConsoleRef.current) {
        originalConsoleRef.current = { error: console.error, warn: console.warn };
        console.error = (...args: unknown[]) => {
          if (isBenignWasmLog(args)) return;
          originalConsoleRef.current!.error(...args);
        };
        console.warn = (...args: unknown[]) => {
          if (isBenignWasmLog(args)) return;
          originalConsoleRef.current!.warn(...args);
        };
      }

      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
      landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(
        fileset,
        {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        },
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("Camera preview unavailable");
      video.srcObject = stream;
      await video.play();

      setPhase("running");

      let index = 0;
      const done: ChallengeName[] = [];

      const tick = () => {
        const landmarker = landmarkerRef.current;
        const element = videoRef.current;
        if (!landmarker || !element || element.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const result = landmarker.detectForVideo(element, performance.now());
        const points: Point[] | undefined = result?.faceLandmarks?.[0];

        if (points && points.length > 0) {
          const current = issued[index];

          /*
           * Sample the sequence on a timer while the face is visible.
           *
           * Paced rather than every frame: at 60fps an unpaced loop would
           * collect the eight it needs inside 150ms, which is one moment of
           * movement rather than a sequence of it. Every ~350ms spreads the
           * eight across the challenge, which is what makes them evidence.
           *
           * `void` because the loop must not await — blocking a rAF callback
           * on a canvas encode drops frames from the detector that is
           * actually judging the challenge.
           */
          const now = performance.now();

          if (
            sequenceRef.current.length < 8 &&
            now - lastFrameAtRef.current > 350
          ) {
            lastFrameAtRef.current = now;
            void capture(0.5, 0.8).then((frame) => {
              if (frame && sequenceRef.current.length < 8) {
                sequenceRef.current.push(frame);
              }
            });
          }

          /*
           * The first ~10 frames are the resting face, not an attempt at the
           * gesture. Collected while the prompt is still being read, so it
           * costs the client nothing.
           */
          if (baselineRef.current === null) {
            baselineSamplesRef.current.push(points);

            if (baselineSamplesRef.current.length >= 10) {
              baselineRef.current = baselineFrom(baselineSamplesRef.current);
            }

            // Judging a gesture against a half-built baseline would be worse
            // than waiting a few frames for a reliable one.
            rafRef.current = requestAnimationFrame(tick);

            return;
          }

          if (current === "blink") {
            const ear = eyeAspectRatio(points);
            if (ear < THRESHOLD.eyeClosed) blinkStateRef.current.sawClosed = true;
            if (blinkStateRef.current.sawClosed && ear > THRESHOLD.eyeOpen) {
              blinkStateRef.current.observed = true;
            }
          }

          if (satisfies(current, points, blinkStateRef.current.observed, baselineRef.current)) {
            done.push(current);
            setCompleted([...done]);
            index += 1;
            blinkStateRef.current = { sawClosed: false, observed: false };

            if (index >= issued.length) {
              void finish(done, attemptId);
              return;
            }
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      cleanup();
      setPhase("error");
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera access was denied. Allow it in your browser settings and try again."
          : "We could not start the camera check. Please try again, or use a different browser.",
      );
    }
  }, [capture, cleanup, finish]);

  const currentChallenge = challenges[completed.length];

  const currentPrompt = currentChallenge
    ? CHALLENGE_PROMPTS[currentChallenge]
    : null;

  const isLive = phase === "running" || phase === "loading";

  return (
    /*
     * A single centred card with the camera in an oval, rather than a video
     * panel beside a checklist.
     *
     * The old layout put a 4:3 rectangle next to a column of text, which made
     * the client's own face small and secondary while the instructions
     * competed with it. Framing the face is what tells somebody where to sit
     * and how close to be — the oval is doing real work, not decoration, and
     * everything else is arranged around it.
     */
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-elegant">
        <div className="p-6 sm:p-8">
          <div className="text-center">
            <h2 className="font-serif text-xl text-navy">{title}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {/* The face frame. */}
          <div className={`relative border-4 overflow-hidden mx-auto mt-7 aspect-[3/4] w-full max-w-[16rem] rounded-[50%] ${phase === "done"
            ? "border-success"
            : phase === "error"
              ? "border-destructive"
              : isLive
                ? "border-gold"
                : "border-border"
            }`}>
            <div
              className={`absolute inset-0 overflow-hiddenn bborder-[3px] transition-colors duration-300 ${phase === "done"
                ? "border-success"
                : phase === "error"
                  ? "border-destructive"
                  : isLive
                    ? "border-gold"
                    : "border-border"
                }`}
            // An oval, not a circle: a head is taller than it is wide, and a
            // circle invites people to fill it by leaning in too close.
            // style={{ borderRadius: "50% / 42%" }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                // Mirrored so movements feel natural; the yaw thresholds
                // account for this.
                className="h-full w-full -sscale-x-100 object-cover"
              />

              {phase === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface text-center">
                  <Camera className="h-6 w-6 text-muted-foreground/50" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Camera off
                  </span>
                </div>
              )}

              {phase === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Preparing
                  </span>
                </div>
              )}

              {phase === "submitting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/70 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-navy-foreground">
                    Checking
                  </span>
                </div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/*
            Progress as pips rather than a numbered checklist. With two
            gestures a list of ticks is more furniture than information, and
            the pips read at a glance while the client is looking at the
            camera rather than at the words.
          */}
          {challenges.length > 0 && phase !== "done" && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {challenges.map((challenge, i) => (
                <span
                  key={challenge}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all duration-300 ${i < completed.length
                    ? "w-8 bg-success"
                    : i === completed.length
                      ? "w-8 bg-gold"
                      : "w-4 bg-border"
                    }`}
                />
              ))}
            </div>
          )}

          {/* One instruction at a time, where the eye already is. */}
          <div className="mt-4 min-h-[3.5rem] text-center">
            {phase === "running" && currentPrompt && (
              <>
                <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  Step {completed.length + 1} of {challenges.length}
                </p>
                <p className="mt-1.5 font-serif text-lg text-navy">
                  {currentPrompt}
                </p>
              </>
            )}

            {message && (
              <p
                role="status"
                aria-live="polite"
                className={`flex items-start justify-center gap-2 text-sm ${phase === "done" ? "text-success" : "text-destructive"
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
          </div>

          {(phase === "idle" || phase === "error") && (
            <button
              type="button"
              onClick={start}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
            >
              <Camera className="h-4 w-4" />
              {phase === "error" ? "Try again" : "Start camera check"}
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
