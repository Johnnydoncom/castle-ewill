"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Upload } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { uploadDocumentAction } from "@/lib/actions/documents.client";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:opacity-50"
    >
      <Upload className="h-4 w-4" />
      {pending ? "Uploading…" : "Upload"}
    </button>
  );
}

/**
 * Identification for the two attesting witnesses.
 *
 * Shown **only when identity verification is on the manual path**. With no
 * automated provider a human reviewer is the entire control, and they need
 * something to check the attestation against. When a provider is active it
 * verifies the testator against a government document, which witness ID adds
 * nothing to — so asking for it then would mean collecting sensitive documents
 * belonging to people who are not our clients, for nobody to read. The server
 * applies the same rule; this component only decides whether to ask.
 */
export function WitnessIdentityUpload({
  uploaded,
  required = 2,
}: {
  uploaded: number;
  required?: number;
}) {
  const [state, action] = useFormAction(uploadDocumentAction);
  const [fileName, setFileName] = useState("");

  const outstanding = Math.max(required - uploaded, 0);
  const isComplete = outstanding === 0;

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-navy">Witness identification</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Upload a government-issued ID for each of your two witnesses. A
            reviewer checks these by hand against the attestation before your
            Will is approved. Ask each witness before uploading their document —
            it is their identity record, not yours.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
            isComplete
              ? "border-success/50 text-success"
              : "border-gold/60 text-gold"
          }`}
        >
          {isComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
          {uploaded} of {required}
        </span>
      </div>

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

      {!isComplete && (
        <form action={action} className="mt-6 flex flex-wrap items-end gap-4">
          {/* Fixed. The kind is not the client's to choose here — this form
              collects one thing. */}
          <input type="hidden" name="kind" value="witness_identity" />

          <label className="flex-1 min-w-56">
            <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Witness {uploaded + 1} identification
            </span>
            <input
              type="file"
              name="file"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) =>
                setFileName(event.target.files?.[0]?.name ?? "")
              }
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
      )}

      {isComplete && (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Both documents are on file. They are encrypted in your vault and
          visible only to the reviewer handling your identity check.
        </p>
      )}
    </section>
  );
}
