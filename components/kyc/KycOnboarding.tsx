"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, ShieldCheck, Upload } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { type FormState } from "@/lib/actions/state";
import {
  ACCEPT_ATTRIBUTE,
  IDENTITY_DOCUMENT_TYPES,
  MAX_UPLOAD_BYTES,
  describeFileProblem,
  formatBytes,
  type IdentityDocumentType,
} from "@/lib/documents";
import { uploadDocumentAction } from "@/lib/actions/documents.client";
import { LivenessCheck } from "@/components/verification/LivenessCheck";

/**
 * The KYC onboarding flow: a valid ID, a passport photograph, then a
 * liveness check compared against the ID. Two documents, not one — the
 * passport photograph is a deliberate headshot, not a frame grabbed
 * mid-challenge, and it's what gets enrolled as the reference every future
 * Will-submission recheck compares against; the ID document is what Smile
 * ID's document-authentication and face-match legs run against here and
 * now.
 *
 * Deliberately not the full `DocumentVault` — these are two fixed-kind
 * uploads with nowhere else to go, not a general document manager. The
 * document-type step exists so the admin identity queue can sort and label
 * captures ("Passport" vs "Driver's licence") without opening every file —
 * see `Document::IDENTITY_DOCUMENT_TYPES` on the backend.
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
      className="flex h-13 w-full items-center justify-center gap-3 bg-navy px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-foreground/30 border-t-navy-foreground"
        />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {pending ? "Uploading…" : "Upload this document"}
    </button>
  );
}

/** Which ID a client will photograph next, as clickable cards rather than a bare select — the choice that drives everything after it deserves the same visual weight as the file picker. */
function DocumentTypeStep({
  onChosen,
}: {
  onChosen: (type: IdentityDocumentType) => void;
}) {
  return (
    <div className="border border-border bg-background p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-navy">
            Which ID will you use?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Choose the document you&apos;ll photograph next. This is the
            anchor we compare your identity check against — you only need to
            do this once.
          </p>

          <div className="mt-6 space-y-2">
            {IDENTITY_DOCUMENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onChosen(type.value)}
                className="flex w-full cursor-pointer items-center justify-between border border-border p-4 text-left transition-colors hover:border-gold hover:bg-gold/5"
              >
                <span className="font-serif text-base text-navy">
                  {type.label}
                </span>
                <span aria-hidden className="text-gold">
                  &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A single fixed-kind file upload, reused for both the ID document and the passport photograph. */
function UploadStep({
  kind,
  identityDocumentType,
  title,
  hint,
  onBack,
  backLabel = "Change",
  onUploaded,
}: {
  kind: "identity_document" | "passport_photograph";
  identityDocumentType?: IdentityDocumentType;
  title: string;
  hint: string;
  onBack?: () => void;
  backLabel?: string;
  onUploaded: () => void;
}) {
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-navy">{title}</h2>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
              >
                {backLabel}
              </button>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>

          <form action={action} className="mt-6 space-y-6">
            <input type="hidden" name="kind" value={kind} />
            {identityDocumentType && (
              <input type="hidden" name="identityDocumentType" value={identityDocumentType} />
            )}
            <Banner state={state} />

            <div className="space-y-2">
              <label
                htmlFor={`kyc-file-${kind}`}
                className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
              >
                File
              </label>
              <input
                id={`kyc-file-${kind}`}
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

/**
 * What is on file, with a way to change it, shown beside the liveness check.
 *
 * Without this the liveness step was a dead end: a client who realised their
 * passport photograph was blurred, or that they had uploaded the wrong ID, had
 * no route back and no way to fix it except to ask us. The documents are only
 * replaceable up to this point — the page redirects once verified, and the
 * vault refuses a replacement after that — so this is the last moment it can
 * be offered, which is exactly why it has to be.
 */
function DocumentsOnFile({
  onReplace,
}: {
  onReplace: (which: Replacing) => void;
}) {
  const rows: Array<{ which: Exclude<Replacing, null>; label: string }> = [
    { which: "identity", label: "Identity document" },
    { which: "passport", label: "Passport photograph" },
  ];

  return (
    <div className="border border-border bg-surface px-5 py-4">
      <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
        Documents on file
      </p>

      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.which}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-navy">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <span className="truncate">{row.label}</span>
            </span>
            <button
              type="button"
              onClick={() => onReplace(row.which)}
              className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
            >
              Replace
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Not clear enough, or the wrong document? Replace it before you start the
        check — once your identity is verified these can no longer be changed
        here.
      </p>
    </div>
  );
}

/** A way out of a replacement the client thought better of, so choosing "Replace" is never a trap of its own. */
function CancelReplacement({ onCancel }: { onCancel: () => void }) {
  return (
    <button
      type="button"
      onClick={onCancel}
      className="mx-auto block text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
    >
      Keep what I already uploaded
    </button>
  );
}

function RejectionNotice({
  reason,
  onReupload,
}: {
  reason: string;
  onReupload: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-5 py-4 text-sm text-navy">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="leading-relaxed">
          Your last attempt was not accepted: <em>{reason}</em>
        </p>
        <button
          type="button"
          onClick={onReupload}
          className="mt-2 text-xs font-medium uppercase tracking-[0.15em] text-navy underline underline-offset-4 hover:text-gold"
        >
          Upload different documents
        </button>
      </div>
    </div>
  );
}

/** Which document the client has asked to swap out, if any. */
type Replacing = "identity" | "passport" | null;

export function KycOnboarding({
  hasIdDocument,
  hasPassportPhoto,
  rejectionReason,
}: {
  hasIdDocument: boolean;
  hasPassportPhoto: boolean;
  /** Set when the most recent kyc-purpose attempt was rejected — surfaced so the client knows what to fix. */
  rejectionReason?: string | null;
}) {
  const [idOnFile, setIdOnFile] = useState(hasIdDocument);
  const [passportOnFile, setPassportOnFile] = useState(hasPassportPhoto);
  const [documentType, setDocumentType] = useState<IdentityDocumentType | null>(null);
  /*
   * Which document is being swapped out, rather than a single "start again"
   * flag.
   *
   * A client fixing a blurred passport photograph should not have to
   * re-photograph an ID that was fine — and a rejection is just as likely to
   * be about one document as both.
   */
  const [replacing, setReplacing] = useState<Replacing>(null);
  // `rejectionReason` is a server prop, stale the instant a fresh upload
  // completes client-side — once acted on, it must not reappear next to the
  // liveness check for documents the client just replaced.
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const notice = rejectionReason && !noticeDismissed && replacing === null && (
    <RejectionNotice
      reason={rejectionReason}
      onReupload={() => setReplacing("identity")}
    />
  );

  function replace(which: Replacing) {
    setReplacing(which);
    // The ID's type is chosen again with it; the old choice belongs to the
    // document being discarded.
    if (which === "identity") setDocumentType(null);
  }

  if (!idOnFile || replacing === "identity") {
    if (!documentType) {
      return (
        <div className="space-y-6">
          {notice}
          <DocumentTypeStep onChosen={setDocumentType} />
          {replacing === "identity" && (
            <CancelReplacement onCancel={() => setReplacing(null)} />
          )}
        </div>
      );
    }

    const label = IDENTITY_DOCUMENT_TYPES.find((t) => t.value === documentType)?.label;

    return (
      <div className="space-y-6">
        {notice}
        <UploadStep
          kind="identity_document"
          identityDocumentType={documentType}
          title={`Upload your ${label}`}
          hint="A clear photo or scan, all four corners visible."
          onBack={() => setDocumentType(null)}
          onUploaded={() => {
            setIdOnFile(true);
            setReplacing(null);
            setNoticeDismissed(true);
          }}
        />
        {replacing === "identity" && (
          <CancelReplacement onCancel={() => setReplacing(null)} />
        )}
      </div>
    );
  }

  if (!passportOnFile || replacing === "passport") {
    return (
      <div className="space-y-6">
        {notice}
        <UploadStep
          kind="passport_photograph"
          title="Upload a passport photograph"
          hint="A recent, well-lit photograph of your face — this becomes the reference we compare against each time you submit or amend your Will."
          // Only on the first pass: mid-flow this goes back a step, whereas a
          // deliberate replacement is abandoned by the link below instead.
          onBack={
            replacing === null
              ? () => {
                  setIdOnFile(false);
                  setDocumentType(null);
                }
              : undefined
          }
          backLabel="Back to ID"
          onUploaded={() => {
            setPassportOnFile(true);
            setReplacing(null);
            setNoticeDismissed(true);
          }}
        />
        {replacing === "passport" && (
          <CancelReplacement onCancel={() => setReplacing(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice}
      <DocumentsOnFile onReplace={replace} />
      <LivenessCheck
        title="Verify your identity"
        description="Now let's confirm it's really you. You'll be asked to perform a few short movements on camera, compared against the ID document you just uploaded."
        footerNote="The image captured is encrypted and stored in your vault. Once approved, your passport photograph becomes the reference we check against each time you submit or amend your Will."
        onVerified={() => {
          // A full reload rather than a client-side refresh: this is the
          // moment `is_kyc_verified` flips, and every server component down
          // the tree (the dashboard banner, the Will gate) should see it.
          window.location.href = "/dashboard/kyc";
        }}
      />
    </div>
  );
}
