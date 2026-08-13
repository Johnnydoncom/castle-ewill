"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Video } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { uploadDocumentAction } from "@/lib/actions/documents.client";

/** Mirrors `vault.max_video_bytes`. Feedback only — the server is the rule. */
const MAX_BYTES = 60 * 1024 * 1024;

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:opacity-50"
    >
      <Video className="h-4 w-4" />
      {pending ? "Uploading…" : "Upload recording"}
    </button>
  );
}

/**
 * The Platinum capability: a recording of the testator reading their own Will.
 *
 * Shown only to a client entitled to it — `can_attach_will_video`, which the
 * API derives from a settled payment. The server refuses the upload regardless;
 * this only decides whether to offer the control, so that somebody who has not
 * bought Platinum is not handed a button whose only outcome is a refusal.
 *
 * The size check here is feedback, not enforcement. A 200 MB file rejected in
 * the browser saves the client a long upload that would have failed at the end
 * of it; the ceiling that matters is `vault.max_video_bytes`, because the vault
 * encrypts whole and holds plaintext and ciphertext at once.
 */
export function WillRecordingUpload({ existing }: { existing: boolean }) {
  const [state, action] = useFormAction(uploadDocumentAction);
  const [fileName, setFileName] = useState("");
  const [tooLarge, setTooLarge] = useState(false);

  return (
    <section className="border border-gold/40 bg-gold/[0.03] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Platinum
          </span>
          <h2 className="mt-2 font-serif text-xl text-navy">
            Your Will, in your own voice
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Once you have printed and signed your Will, record yourself reading
            it aloud. If anyone later says you were not well enough to make it,
            the recording answers them directly — in your own words, on the day
            you signed.
          </p>
        </div>

        {existing && (
          <span className="inline-flex shrink-0 items-center gap-2 border border-success/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            On file
          </span>
        )}
      </div>

      <ul className="mt-6 space-y-1.5 text-sm text-muted-foreground">
        <li>• Film on your phone or laptop — nothing to install.</li>
        <li>• Read the Will aloud, holding the signed copy.</li>
        <li>• Say the date, and that you are making it freely.</li>
        <li>• MP4, MOV or WebM, up to 60 MB.</li>
      </ul>

      {state.status === "error" && (
        <p className="mt-5 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="mt-5 border border-success/40 bg-success/5 p-3 text-sm text-success">
          {state.message}
        </p>
      )}
      {tooLarge && (
        <p className="mt-5 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          That recording is over 60 MB. Record at a lower quality, or keep it
          shorter, and try again.
        </p>
      )}

      <form action={action} className="mt-6 flex flex-wrap items-end gap-4">
        {/* Fixed: this form uploads one thing, and the kind is not the
            client's to choose. */}
        <input type="hidden" name="kind" value="will_video" />

        <label className="min-w-56 flex-1">
          <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {existing ? "Replace your recording" : "Your recording"}
          </span>
          <input
            type="file"
            name="file"
            required
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? "");
              setTooLarge((file?.size ?? 0) > MAX_BYTES);
            }}
            className="mt-2 block w-full text-sm text-navy file:mr-4 file:border file:border-border file:bg-surface file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.15em] file:text-navy hover:file:border-gold"
          />
          {fileName && (
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {fileName}
            </span>
          )}
        </label>

        <Submit />
      </form>

      {existing && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Uploading again replaces the recording you already have — a Will has
          one, so your executors are never left choosing between two.
        </p>
      )}
    </section>
  );
}
