/**
 * Document vault constants and shared validation.
 *
 * These live apart from `lib/actions/documents.ts` because that module is
 * server-only — it reaches the database and the storage adapters — while the
 * upload UI needs the same limits and MIME rules to give immediate feedback.
 */

/** 10 MB — comfortably above a passport scan, below a denial-of-service. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Accepted media types.
 *
 * A browser-declared MIME type is attacker-controlled, so it is checked
 * *together with* the file extension rather than trusted alone. The real
 * protection is downstream: uploads are stored as opaque ciphertext and served
 * back only with a fixed Content-Type and an attachment disposition, so a file
 * that lies about its type still cannot be executed by a browser.
 */
export const ACCEPTED_TYPES: Record<string, readonly string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/heic": ["heic"],
};

/** `accept` attribute for the file input. */
export const ACCEPT_ATTRIBUTE = Object.keys(ACCEPTED_TYPES).join(",");

export const UPLOADABLE_KINDS = [
  {
    value: "identity_document",
    label: "Identity document",
    hint: "Passport, driver's licence, national ID or voter's card.",
  },
  {
    value: "passport_photograph",
    label: "Passport photograph",
    hint: "A recent photograph of yourself.",
  },
  {
    value: "supporting_document",
    label: "Supporting document",
    hint: "Title deeds, share certificates, policy documents.",
  },
] as const;

export type UploadableKind = (typeof UPLOADABLE_KINDS)[number]["value"];

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  identity_document: "Identity document",
  passport_photograph: "Passport photograph",
  witness_identity: "Witness identification",
  will_video: "Will recording",
  supporting_document: "Supporting document",
  generated_will: "Generated Will",
  signed_will: "Signed Will",
};

/**
 * Which government-issued document a client is uploading for KYC.
 *
 * Asked *before* the file picker opens, not inferred from the image
 * afterwards — a reviewer scanning the identity queue needs to know at a
 * glance whether they're comparing a passport photo page or a driver's
 * licence, and asking is far cheaper than running OCR on every capture.
 * Matches `Document::IDENTITY_DOCUMENT_TYPES` on the backend exactly.
 */
export const IDENTITY_DOCUMENT_TYPES = [
  { value: "passport", label: "International passport" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "national_id", label: "National ID (NIN slip)" },
  { value: "voters_card", label: "Voter's card (PVC)" },
  { value: "other", label: "Other government-issued ID" },
] as const;

export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number]["value"];

export const IDENTITY_DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  IDENTITY_DOCUMENT_TYPES.map((t) => [t.value, t.label]),
);

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/** Shared client/server check so the browser can reject a file before upload. */
export function describeFileProblem(
  name: string,
  type: string,
  size: number,
): string | null {
  if (size === 0) return "That file appears to be empty.";

  if (size > MAX_UPLOAD_BYTES) {
    return `That file is ${(size / 1024 / 1024).toFixed(1)} MB. The limit is ${
      MAX_UPLOAD_BYTES / 1024 / 1024
    } MB.`;
  }

  const allowed = ACCEPTED_TYPES[type];
  if (!allowed || !allowed.includes(extensionOf(name))) {
    return "Only PDF, JPG, PNG, WEBP and HEIC files are accepted.";
  }

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
