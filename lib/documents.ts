/**
 * Document vault constants.
 *
 * These live outside `lib/actions/documents.ts` because a `"use server"` module
 * may only export async functions — exporting a constant from one is a build
 * error. Both the server actions and the client UI import from here.
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
  supporting_document: "Supporting document",
  generated_will: "Generated Will",
  signed_will: "Signed Will",
};

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
