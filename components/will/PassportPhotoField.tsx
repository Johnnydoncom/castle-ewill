"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Check, Loader2 } from "lucide-react";

import { uploadDocumentAction } from "@/lib/actions/documents.client";

/**
 * The testator's photograph, as a field rather than a panel.
 *
 * It is printed on the face of the Will, so it belongs among the personal
 * details — beside the name and the address, not in a box of its own with its
 * own submit button. Choosing an image is the whole interaction: the preview
 * appears at once and the upload happens behind it, so there is nothing to
 * press and nothing to forget to press.
 *
 * ## Why the preview is fetched rather than linked
 *
 * The vault serves documents as `Content-Disposition: attachment`, which a
 * browser honours by downloading rather than rendering — an `<img src>` at
 * that URL shows nothing. So the bytes are fetched with the session cookie and
 * turned into an object URL here. That also keeps the hardening on the
 * download route intact: nothing had to be relaxed to show a picture.
 */
export function PassportPhotoField({
  documentId,
  onUploaded,
}: {
  /** The photograph already on file, if there is one. */
  documentId?: string | null;
  /** Called once a new one is stored, so the page can stop asking for it. */
  onUploaded?: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * The photograph already on file.
   *
   * Read once, and the object URL revoked on the way out — a blob left
   * unreleased is a copy of somebody's face held in memory for as long as the
   * tab lives.
   */
  useEffect(() => {
    if (!documentId) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? ""}/documents/${documentId}/download`,
          { credentials: "include" },
        );

        if (!response.ok || cancelled) return;

        objectUrl = URL.createObjectURL(await response.blob());

        setPreview(objectUrl);
      } catch {
        // A preview that will not load is not worth an error message: the
        // field still works, and the client can simply choose a new image.
      }
    })();

    return () => {
      cancelled = true;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  const choose = async (file: File) => {
    // Shown before the upload starts, from the file itself: the client should
    // see what they picked immediately, not once a round trip has finished.
    setPreview(URL.createObjectURL(file));
    setStatus("saving");
    setMessage(null);

    const body = new FormData();

    body.set("file", file);
    body.set("kind", "passport_photograph");

    const result = await uploadDocumentAction({ status: "idle" }, body);

    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message ?? "That photograph could not be saved.");

      return;
    }

    setStatus("saved");
    onUploaded?.();
  };

  return (
    <div className="sm:col-span-2">
      <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        Passport photograph
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-5">
        {/* The frame keeps passport proportions, which is how it prints. */}
        <div className="relative h-[45mm] w-[35mm] shrink-0 overflow-hidden border border-border bg-surface">
          {preview ? (
            /*
             * An object URL for bytes fetched with the session cookie: there
             * is no path for the image optimiser to fetch, so `next/image`
             * has nothing to optimise here.
             */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Your passport photograph"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
              <Camera className="h-5 w-5 text-muted-foreground/50" />
              <span className="px-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                No photograph
              </span>
            </div>
          )}

          {status === "saving" && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/60">
              <Loader2 className="h-5 w-5 animate-spin text-navy-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Printed on the face of your Will. Use a recent photograph against a
            plain background — it saves as soon as you choose it.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "saving"}
            className="inline-flex h-11 items-center gap-2 border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {preview ? "Change photograph" : "Choose a photograph"}
          </button>

          {/*
            The real input, kept out of sight but not out of the accessibility
            tree — the button above drives it.
          */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            aria-label="Passport photograph"
            onChange={(event) => {
              const file = event.target.files?.[0];

              // Cleared so choosing the same file twice still fires a change —
              // which is what a retry after a failed upload is.
              event.target.value = "";

              if (file) void choose(file);
            }}
          />

          {status === "saved" && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 text-sm text-success"
            >
              <Check className="h-4 w-4" />
              Saved
            </p>
          )}

          {status === "error" && message && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-start gap-1.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
