"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, ImageUp, Loader2 } from "lucide-react";

import { uploadDocumentAction } from "@/lib/actions/documents.client";
import { useFormAction } from "@/hooks/use-api-form";

/**
 * The upload button, which knows when it is working.
 *
 * An image goes over the wire and into the vault, which is not instant. A
 * button that does not change is a button people press again.
 */
function Submit({ present }: { present: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center gap-2 bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Uploading…" : present ? "Replace it" : "Upload"}
    </button>
  );
}

/**
 * The testator's passport photograph, which is printed on the Will.
 *
 * Part of the instrument rather than of the identity check — which is why it
 * is asked for here, beside the Will, rather than during KYC. A Nigerian Will
 * is customarily issued with the testator's photograph on its face, and an
 * executor producing a document that shows who made it is in a materially
 * stronger position than one holding four pages of text.
 *
 * It is the one image this product does keep, because it is part of a document
 * the client owns rather than evidence about them.
 */
export function PassportPhotograph({ present }: { present: boolean }) {
  const [state, action] = useFormAction(uploadDocumentAction);
  const [fileName, setFileName] = useState("");

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-navy">Your photograph</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A passport photograph is printed on the face of your Will. Use a
            recent one, taken against a plain background, in the usual passport
            proportions.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
            present
              ? "border-success/50 text-success"
              : "border-gold/60 text-gold"
          }`}
        >
          {present ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <ImageUp className="h-3.5 w-3.5" />
          )}
          {present ? "On file" : "Needed"}
        </span>
      </div>

      <form action={action} className="mt-6 space-y-4">
        {/* Fixed: this panel uploads one thing, and the kind is not the
            client's to choose. */}
        <input type="hidden" name="kind" value="passport_photograph" />

        <label className="flex cursor-pointer flex-wrap items-center gap-4">
          <span className="inline-flex h-11 items-center border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold">
            Choose a photograph
          </span>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png"
            required
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          />
          <span className="truncate text-sm text-muted-foreground">
            {fileName || "JPEG or PNG"}
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <Submit present={present} />

          {state.status !== "idle" && state.message && (
            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${
                state.status === "error" ? "text-destructive" : "text-success"
              }`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
