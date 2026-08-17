"use client";

import { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";

import {
  IDENTITY_DOCUMENT_TYPES,
  type IdentityDocumentType,
} from "@/lib/documents";
import { SmileIdCapture } from "@/components/verification/SmileIdCapture";

/**
 * The KYC flow: pick which ID you will show, then one Smile ID session that
 * photographs it and your face together.
 *
 * There are no uploads here any more. The client used to be asked for a valid
 * ID and a passport photograph, both of which went into the vault and stayed
 * there; Smile ID's component photographs the document under its own guidance,
 * checks it against the face in the same session, and the images never touch a
 * disk of ours. The document-type question survives because the component uses
 * it to frame the capture — a passport page is not a card — and because it is
 * what selects the vendor's template for that document.
 */

/** Which ID a client will photograph, as cards rather than a bare select. */
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
            Have it with you — you&apos;ll photograph it in a moment, on camera,
            alongside a short check that it&apos;s really you. You only need to
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

function RejectionNotice({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-5 py-4 text-sm text-navy">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <p className="leading-relaxed">
        Your last attempt was not accepted: <em>{reason}</em> You can run the
        check again below.
      </p>
    </div>
  );
}

export function KycOnboarding({
  rejectionReason,
}: {
  /** Set when the most recent kyc-purpose attempt was rejected — surfaced so the client knows what to fix. */
  rejectionReason?: string | null;
}) {
  const [documentType, setDocumentType] = useState<IdentityDocumentType | null>(
    null,
  );

  const notice = rejectionReason && <RejectionNotice reason={rejectionReason} />;

  if (documentType === null) {
    return (
      <div className="space-y-6">
        {notice}
        <DocumentTypeStep onChosen={setDocumentType} />
      </div>
    );
  }

  const label = IDENTITY_DOCUMENT_TYPES.find(
    (t) => t.value === documentType,
  )?.label;

  return (
    <div className="space-y-6">
      {notice}

      {/*
        Still changeable right up to the moment the check starts. Choosing the
        wrong document here means being guided to photograph the wrong thing,
        and there is no reason that should cost a support request.
      */}
      <div className="flex items-center justify-between gap-3 border border-border bg-surface px-5 py-3 text-sm">
        <span className="text-navy">
          Using your <strong className="font-medium">{label}</strong>
        </span>
        <button
          type="button"
          onClick={() => setDocumentType(null)}
          className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
        >
          Change
        </button>
      </div>

      <SmileIdCapture
        title="Verify your identity"
        description={`You'll be asked to photograph your ${label?.toLowerCase()} and then your face. It takes about a minute.`}
        footerNote="Your photographs are sent straight to our identity provider for checking. We do not keep them."
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
