"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, X } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { decideVerificationAction } from "@/lib/actions/review";

function Submit({
  label,
  busy,
  tone,
}: {
  label: string;
  busy: string;
  tone: "approve" | "reject";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-9 items-center gap-2 border px-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "approve"
          ? "border-success/50 text-success hover:bg-success/5"
          : "border-destructive/50 text-destructive hover:bg-destructive/5"
      }`}
    >
      {tone === "approve" ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
      {pending ? busy : label}
    </button>
  );
}

/**
 * Approve or reject one liveness attempt.
 *
 * A rejection requires a reason, and that reason is shown to the client — so
 * "no" is never the whole answer. Someone whose photograph was too dark needs
 * to be told that, not simply refused and left to guess.
 *
 * The capture itself is not embedded here. It is a vault document, reachable
 * only through the vault's own authorised download, which records every read:
 * a reviewer looking at a client's face should leave a trace.
 */
const REFERENCE_KIND_LABEL: Record<string, string> = {
  id_document: "the identity document",
  enrolled_selfie: "their enrolled selfie",
};

const IDENTITY_DOCUMENT_TYPE_LABEL: Record<string, string> = {
  passport: "Passport",
  drivers_license: "Driver's licence",
  national_id: "National ID",
  voters_card: "Voter's card",
  other: "Other ID",
};

export function VerificationDecision({
  verificationId,
  captureDocumentId,
  referenceDocumentId,
  referenceKind,
  referenceDocumentType,
}: {
  verificationId: string;
  captureDocumentId: string | null;
  referenceDocumentId?: string | null;
  referenceKind?: "id_document" | "enrolled_selfie" | null;
  referenceDocumentType?: string | null;
}) {
  const [rejecting, setRejecting] = useState(false);

  const [approveState, approve] = useFormAction(decideVerificationAction);
  const [rejectState, reject] = useFormAction(decideVerificationAction);

  const error =
    approveState.status === "error"
      ? approveState.message
      : rejectState.status === "error"
        ? rejectState.message
        : null;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {captureDocumentId && (
          <a
            href={`${apiBase}/documents/${captureDocumentId}/download`}
            className="inline-block text-xs text-navy underline underline-offset-4 hover:text-gold"
          >
            View the capture
          </a>
        )}
        {referenceDocumentId ? (
          <a
            href={`${apiBase}/documents/${referenceDocumentId}/download`}
            className="inline-flex items-center gap-1.5 text-xs text-navy underline underline-offset-4 hover:text-gold"
          >
            View {REFERENCE_KIND_LABEL[referenceKind ?? ""] ?? "the reference image"}
            {referenceDocumentType && (
              <span className="rounded-sm border border-gold/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold no-underline">
                {IDENTITY_DOCUMENT_TYPE_LABEL[referenceDocumentType] ?? referenceDocumentType}
              </span>
            )}
          </a>
        ) : (
          <span className="text-xs italic text-muted-foreground">
            No reference image on file to compare against.
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form action={approve}>
          <input type="hidden" name="verificationId" value={verificationId} />
          <input type="hidden" name="decision" value="approve" />
          <Submit label="Approve" busy="Approving…" tone="approve" />
        </form>

        {!rejecting && (
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="inline-flex h-9 items-center gap-2 border border-border px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
        )}
      </div>

      {rejecting && (
        <form action={reject} className="max-w-md space-y-2">
          <input type="hidden" name="verificationId" value={verificationId} />
          <input type="hidden" name="decision" value="reject" />
          <label
            htmlFor={`reason-${verificationId}`}
            className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
          >
            Why can this not be accepted?
          </label>
          <textarea
            id={`reason-${verificationId}`}
            name="reason"
            rows={2}
            required
            minLength={5}
            placeholder="The photograph is too dark to compare against the ID."
            className="w-full border border-border bg-transparent px-3 py-2 text-sm text-navy placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
          />
          {rejectState.fieldErrors?.reason && (
            <p className="text-xs text-destructive">
              {rejectState.fieldErrors.reason[0]}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This is sent to the client, so tell them what to correct.
          </p>
          <div className="flex gap-2">
            <Submit label="Confirm rejection" busy="Rejecting…" tone="reject" />
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="h-9 px-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-navy"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
