"use client";

import Link from "next/link";
import { useFormAction } from "@/hooks/use-api-form";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Download, Lock, Trash2, Upload } from "lucide-react";

import { type FormState } from "@/lib/actions/state";
import {
  ACCEPT_ATTRIBUTE,
  DOCUMENT_KIND_LABELS,
  IDENTITY_DOCUMENT_TYPE_LABELS,
  IDENTITY_DOCUMENT_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOADABLE_KINDS,
  describeFileProblem,
  formatBytes,
} from "@/lib/documents";
import { type VaultDocument } from "@/lib/actions/documents";
import type { ApiWill } from "@/lib/actions/will";
import { renewHrefFor, willDownloadBlock } from "@/lib/will/download";
import {
  uploadDocumentAction,
  deleteDocumentAction,
} from "@/lib/actions/documents.client";

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
      {pending ? "Encrypting…" : "Upload to vault"}
    </button>
  );
}

function UploadForm() {
  const [state, action] = useFormAction(uploadDocumentAction);
  const [clientError, setClientError] = useState<string | null>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [kind, setKind] = useState<string>(UPLOADABLE_KINDS[0].value);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelected(file);
    setClientError(
      file ? describeFileProblem(file.name, file.type, file.size) : null,
    );
  }

  return (
    <form
      action={action}
      className="space-y-6"
      onSubmit={() => {
        // Clear the picker after a submission so a re-upload is deliberate.
        queueMicrotask(() => {
          if (inputRef.current) inputRef.current.value = "";
          setSelected(null);
        });
      }}
    >
      <Banner state={state} />

      <div className="space-y-3">
        <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
          Document type
        </p>
        <div className="space-y-2">
          {UPLOADABLE_KINDS.map((option, index) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 border border-border p-4 transition-colors hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/5"
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                defaultChecked={index === 0}
                onChange={() => setKind(option.value)}
                className="mt-1 h-4 w-4 shrink-0 border-border text-navy focus:ring-gold"
              />
              <span>
                <span className="block font-serif text-base text-navy">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.kind && (
          <p className="text-xs text-destructive">{state.fieldErrors.kind[0]}</p>
        )}
      </div>

      {kind === "identity_document" && (
        <div className="space-y-2">
          <label
            htmlFor="identity-document-type"
            className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
          >
            Which ID is this?
          </label>
          <select
            id="identity-document-type"
            name="identityDocumentType"
            required
            defaultValue=""
            className="w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-lg text-navy focus:border-gold focus:outline-none focus:ring-0"
          >
            <option value="" disabled>
              Choose a document type…
            </option>
            {IDENTITY_DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.identity_document_type && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.identity_document_type[0]}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="vault-file"
          className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
        >
          File
        </label>
        <input
          id="vault-file"
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
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

function DocumentRow({ record }: { record: VaultDocument }) {
  const [state, action] = useFormAction(deleteDocumentAction);

  return (
    <li className="grid gap-3 px-5 py-4 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy">
          {record.file_name}
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {DOCUMENT_KIND_LABELS[record.kind] ?? record.kind}
          {record.identity_document_type &&
            ` (${IDENTITY_DOCUMENT_TYPE_LABELS[record.identity_document_type] ?? record.identity_document_type})`}{" "}
          &middot; {formatBytes(record.size_bytes)} &middot;{" "}
          {new Date(record.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        {/*
          The date, on the screen the document is on.
          
          Not left to email. An email is not a delivery guarantee, and the
          consequence here is somebody unable to open their own Will.
        */}
        {record.download_available === false ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-destructive">
            Your subscription has ended, so downloading is paused.{" "}
            <Link href={renewHrefFor(record.will_id)} className="underline underline-offset-4">
              Renew your subscription
            </Link>{" "}
            to download it again — nothing has been deleted.
          </p>
        ) : (
          record.vault_access_ends_at && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-navy">
              Downloads stop on{" "}
              {new Date(record.vault_access_ends_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              unless your subscription is renewed.{" "}
              <Link href={renewHrefFor(record.will_id)} className="underline underline-offset-4">
                Renew now
              </Link>
            </p>
          )
        )}

        {record.document_number && (
          <p className="mt-1 font-mono text-[11px] tracking-wider text-muted-foreground">
            {record.document_number}
            {record.version && record.version > 1 ? ` · v${record.version}` : ""}
          </p>
        )}
        {record.revisions && record.revisions.length > 0 && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-xs text-navy underline underline-offset-4">
              {record.revisions.length} previous version
              {record.revisions.length > 1 ? "s" : ""}
            </summary>
            <ul className="mt-1.5 space-y-1">
              {[...record.revisions].reverse().map((revision) => (
                <li
                  key={revision.version}
                  className="text-[11px] text-muted-foreground"
                >
                  v{revision.version} &middot; {revision.file_name} &middot;{" "}
                  {formatBytes(revision.size_bytes)}
                  {revision.superseded_at && (
                    <>
                      {" "}
                      &middot;{" "}
                      {new Date(revision.superseded_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
        {state.status === "error" && state.message && (
          <p className="mt-1 text-xs text-destructive">{state.message}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {record.is_encrypted && (
          <span className="hidden border border-border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:inline-block">
            Encrypted
          </span>
        )}
        {record.download_available === false ? (
          <span
            aria-disabled="true"
            title="Renew your subscription to download"
            className="inline-flex cursor-not-allowed items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Lock className="h-3.5 w-3.5" />
            Download
          </span>
        ) : (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/documents/${record.id}/download`}
            className="inline-flex items-center gap-1.5 text-xs text-navy underline underline-offset-4 transition-colors hover:text-gold"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
        <form action={action}>
          <input type="hidden" name="documentId" value={record.id} />
          <DeleteButton />
        </form>
      </div>
    </li>
  );
}

/**
 * The client's paid Wills, downloadable from the vault.
 *
 * A Will's PDF is produced when it is downloaded (`/wills/{id}/pdf`), which
 * files a copy here as it goes — so a Will never yet downloaded had no row in
 * the vault and did not appear in it at all. Listed from the Wills themselves
 * now, behind exactly the gates the Will's own page uses: paid for, identity
 * confirmed, and an active subscription.
 */
function WillCopies({ wills }: { wills: ApiWill[] }) {
  if (wills.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl text-navy">
        {wills.length === 1 ? "Your Will" : "Your Wills"}
      </h2>
      <ul className="divide-y divide-border border border-border bg-background">
        {wills.map((will) => {
          const block = will.journey?.can_print
            ? null
            : (willDownloadBlock(will.id, will.journey?.print_blocked_by) ?? {
                message: "Your Will cannot be downloaded yet.",
                cta: { label: "Open this Will", href: `/dashboard/wills/${will.id}` },
              });

          return (
            <li
              key={will.id}
              className="grid gap-3 px-5 py-4 sm:flex sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{will.title}</p>
                <p className="mt-0.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                  {will.reference}
                  {will.version > 1 ? ` · v${will.version}` : ""}
                </p>
                {block && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-destructive">
                    {block.message}{" "}
                    <Link href={block.cta.href} className="underline underline-offset-4">
                      {block.cta.label}
                    </Link>
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4">
                {block ? (
                  <span
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Download
                  </span>
                ) : (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/wills/${will.id}/pdf`}
                    className="inline-flex items-center gap-1.5 text-xs text-navy underline underline-offset-4 transition-colors hover:text-gold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DocumentVault({
  records,
  wills = [],
}: {
  records: VaultDocument[];
  /** The client's paid Wills, listed above their documents. */
  wills?: ApiWill[];
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
      <div className="space-y-8">
      <WillCopies wills={wills} />

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Your documents</h2>

        {records.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm italic text-muted-foreground">
              Your vault is empty. Upload an identity document to begin.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border bg-background">
            {records.map((record) => (
              <DocumentRow key={record.id} record={record} />
            ))}
          </ul>
        )}
      </section>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-navy">Add a document</h2>
        <div className="border border-border bg-surface p-6">
          <UploadForm />
        </div>
      </section>
    </div>
  );
}
