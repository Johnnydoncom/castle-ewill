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

/**
 * A Will recording — the Platinum capability — has its own formats and its
 * own ceiling, as `vault.allowed_video_types` and `vault.max_video_bytes` do on
 * the server. Feedback only: the server is the rule, and refuses a recording to
 * anybody without a settled Platinum payment.
 */
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

export const ACCEPTED_VIDEO_TYPES: Record<string, readonly string[]> = {
  "video/mp4": ["mp4", "m4v"],
  "video/quicktime": ["mov"],
  "video/webm": ["webm"],
};

/** `accept` for the recording input: types and extensions, since some pickers honour only one. */
export const VIDEO_ACCEPT_ATTRIBUTE = [
  ...Object.keys(ACCEPTED_VIDEO_TYPES),
  ...Object.values(ACCEPTED_VIDEO_TYPES)
    .flat()
    .map((extension) => `.${extension}`),
].join(",");

export const UPLOADABLE_KINDS = [
  {
    value: "identity_document",
    label: "Identity document",
    hint: "Passport, driver's licence, national ID or voter's card.",
  },
  /*
   * No passport photograph here. It is printed on one Will, so it is added on
   * the first step of that Will, which names it — one uploaded here would
   * belong to no Will and appear on none.
   */
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

/**
 * Shared client check so the browser can reject a file before upload.
 *
 * By kind: a Will recording (`will_video`) is checked against the video formats
 * and the video ceiling, and every other upload against the document formats.
 * It used to check every upload against the document list, so a Platinum
 * client's MP4 was refused in the browser — "Only PDF, JPG, PNG, WEBP and HEIC
 * files are accepted" — before the server, which accepts it, was ever asked
 * (fixed 2026-09-14).
 */
export function describeFileProblem(
  name: string,
  type: string,
  size: number,
  kind?: string,
): string | null {
  if (size === 0) return "That file appears to be empty.";

  const isRecording = kind === "will_video";
  const limit = isRecording ? MAX_VIDEO_BYTES : MAX_UPLOAD_BYTES;

  if (size > limit) {
    return `That file is ${(size / 1024 / 1024).toFixed(1)} MB. The limit is ${limit / 1024 / 1024} MB.`;
  }

  const extension = extensionOf(name);

  if (isRecording) {
    const knownExtension = Object.values(ACCEPTED_VIDEO_TYPES).some((extensions) =>
      extensions.includes(extension),
    );

    /*
     * The extension decides, and a declared type may only contradict it.
     * Browsers are inconsistent about video types — a .mov can arrive as
     * `video/quicktime` or with no type at all — and the server reads the
     * file's real type regardless.
     */
    const declared = ACCEPTED_VIDEO_TYPES[type];
    const contradicted =
      type !== "" &&
      (!type.startsWith("video/") || (declared !== undefined && !declared.includes(extension)));

    return knownExtension && !contradicted ? null : "Only MP4, MOV and WebM recordings are accepted.";
  }

  const allowed = ACCEPTED_TYPES[type];
  if (!allowed || !allowed.includes(extension)) {
    return "Only PDF, JPG, PNG, WEBP and HEIC files are accepted.";
  }

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
