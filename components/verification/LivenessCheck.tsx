"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2 } from "lucide-react";

import {
  startVerificationAction,
  submitVerificationAction,
} from "@/lib/actions/verification.client";
import { idleState } from "@/lib/actions/state";

import {
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

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeName[]>([]);
  const [completed, setCompleted] = useState<ChallengeName[]>([]);

  // Blink needs open → closed → open across frames, so it is tracked here
  // rather than inferred from a single frame.
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

  const capture = useCallback((): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return Promise.resolve(null);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return Promise.resolve(null);

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9),
    );
  }, []);

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

          if (current === "blink") {
            const ear = eyeAspectRatio(points);
            if (ear < THRESHOLD.eyeClosed) blinkStateRef.current.sawClosed = true;
            if (blinkStateRef.current.sawClosed && ear > THRESHOLD.eyeOpen) {
              blinkStateRef.current.observed = true;
            }
          }

          if (satisfies(current, points, blinkStateRef.current.observed)) {
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
  }, [cleanup, finish]);

  const currentChallenge = challenges[completed.length];

  return (
    <div className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <Camera className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-navy">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-[280px_1fr]">
            <div className="relative aspect-[4/3] overflow-hidden border border-border bg-navy/5">
              <video
                ref={videoRef}
                playsInline
                muted
                // Mirrored so movements feel natural; the yaw thresholds account
                // for this.
                className="h-full w-full -scale-x-100 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {phase === "idle" && (
                <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Camera off
                </div>
              )}
              {phase === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-gold" />
                  Preparing…
                </div>
              )}
            </div>

            <div>
              {phase === "running" && currentChallenge && (
                <div className="border-l-2 border-gold bg-gold/5 px-4 py-3">
                  <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                    Step {completed.length + 1} of {challenges.length}
                  </p>
                  <p className="mt-2 font-serif text-lg text-navy">
                    {CHALLENGE_PROMPTS[currentChallenge]}
                  </p>
                </div>
              )}

              {challenges.length > 0 && (
                <ol className="mt-4 space-y-2">
                  {challenges.map((challenge, i) => {
                    const isDone = i < completed.length;
                    return (
                      <li
                        key={challenge}
                        className={`flex items-center gap-2.5 text-sm ${
                          isDone ? "text-navy" : "text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                        )}
                        {CHALLENGE_PROMPTS[challenge]}
                      </li>
                    );
                  })}
                </ol>
              )}

              {message && (
                <p
                  role="status"
                  className={`mt-4 flex items-start gap-2 text-sm ${
                    phase === "done" ? "text-success" : "text-destructive"
                  }`}
                >
                  {phase === "done" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {message}
                </p>
              )}

              {(phase === "idle" || phase === "error") && (
                <button
                  type="button"
                  onClick={start}
                  className="mt-5 flex h-11 items-center justify-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90"
                >
                  {phase === "error" ? "Try again" : "Start identity check"}
                </button>
              )}

              {phase === "submitting" && (
                <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  Checking…
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            {footerNote}
          </p>
        </div>
      </div>
    </div>
  );
}
