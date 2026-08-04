"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, ShieldCheck, Upload } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { type FormState } from "@/lib/actions/state";
import {
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  describeFileProblem,
  formatBytes,
} from "@/lib/documents";
import { uploadDocumentAction } from "@/lib/actions/documents.client";
import { LivenessCheck } from "@/components/verification/LivenessCheck";

/**
 * The KYC onboarding flow: an identity document, then a liveness check
 * compared against it.
 *
 * Deliberately not the full `DocumentVault` — this is a single fixed-kind
 * upload with nowhere else to go, not a general document manager.
 */

function Banner({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const success = state.status === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 border-l-2 px-4 py-3 text-sm ${
        success
          ? "border-success bg-success/5 text-navy"
          : "border-destructive bg-destructive/5 text-navy"
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${success ? "text-success" : "text-destructive"}`}
      />
      <p>{state.message}</p>
    </div>
  );
}

function UploadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="flex h-13 items-center justify-center gap-3 bg-navy px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-foreground/30 border-t-navy-foreground"
        />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {pending ? "Uploading…" : "Upload identity document"}
    </button>
  );
}

function IdUploadStep({ onUploaded }: { onUploaded: () => void }) {
  const [state, action] = useFormAction(uploadDocumentAction, {
    onSuccess: onUploaded,
  });
  const [clientError, setClientError] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelected(file);
    setClientError(
      file ? describeFileProblem(file.name, file.type, file.size) : null,
    );
  }

  return (
    <div className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-navy">
            Upload an identity document
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A passport, driver&apos;s licence, national ID or voter&apos;s
            card. This is the anchor we compare your identity check against —
            you only need to do this once.
          </p>

          <form action={action} className="mt-6 space-y-6">
            <input type="hidden" name="kind" value="identity_document" />
            <Banner state={state} />

            <div className="space-y-2">
              <label
                htmlFor="kyc-id-file"
                className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
              >
                File
              </label>
              <input
                id="kyc-id-file"
                ref={inputRef}
                type="file"
                name="file"
                required
                accept={ACCEPT_ATTRIBUTE}
                onChange={onFileChange}
                aria-invalid={Boolean(clientError)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:border file:border-border file:bg-background file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.15em] file:text-navy hover:file:border-gold hover:file:text-gold"
              />
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG, WEBP or HEIC. Maximum{" "}
                {MAX_UPLOAD_BYTES / 1024 / 1024} MB.
                {selected && !clientError && (
                  <span className="text-navy">
                    {" "}
                    Selected: {selected.name} ({formatBytes(selected.size)}).
                  </span>
                )}
              </p>
              {(clientError || state.fieldErrors?.file) && (
                <p className="text-xs text-destructive">
                  {clientError ?? state.fieldErrors?.file?.[0]}
                </p>
              )}
            </div>

            <UploadButton disabled={Boolean(clientError) || !selected} />
          </form>
        </div>
      </div>
    </div>
  );
}

export function KycOnboarding({
  hasIdDocument,
}: {
  hasIdDocument: boolean;
}) {
  const [idOnFile, setIdOnFile] = useState(hasIdDocument);

  if (!idOnFile) {
    return <IdUploadStep onUploaded={() => setIdOnFile(true)} />;
  }

  return (
    <LivenessCheck
      title="Verify your identity"
      description="Now let's confirm it's really you. You'll be asked to perform a few short movements on camera, compared against the document you just uploaded."
      footerNote="The image captured is encrypted and stored in your vault. Once approved, it becomes the reference we check against each time you submit or amend your Will."
      onVerified={() => {
        // A full reload rather than a client-side refresh: this is the
        // moment `is_kyc_verified` flips, and every server component down
        // the tree (the dashboard banner, the Will gate) should see it.
        window.location.href = "/dashboard/kyc";
      }}
    />
  );
}
