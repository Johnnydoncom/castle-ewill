import { api } from "@/lib/api/browser";
import { describeFileProblem } from "@/lib/documents";
import { errorState, successState, type FormState } from "./state";
import type { VaultDocument } from "./documents";

/**
 * The document vault's mutations, called directly from the browser.
 *
 * Uploads go straight from the browser to Laravel — the multipart body never
 * transits this Next server, which sidesteps Vercel's serverless body-size
 * ceiling for free. Downloads are a plain `<a href>` at the backend, built
 * inline by the component; there is no route, here or there, that serves a
 * vault file statically.
 */

export async function uploadDocumentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return errorState("Choose a file to upload.");
  }

  // Client-side pre-check for a fast, specific message. The backend re-checks
  // type, extension and size, and refuses a mismatch between the declared type
  // and the real one — that check is the guarantee, this one is courtesy.
  const problem = describeFileProblem(file.name, file.type, file.size);
  if (problem) return errorState(problem);

  if (!kind) return errorState("Choose what kind of document this is.");

  const body = new FormData();
  body.set("file", file);
  body.set("kind", kind);

  const willId = formData.get("willId");
  if (typeof willId === "string" && willId) body.set("will_id", willId);

  const result = await api<{ data: VaultDocument }>("/documents", {
    method: "POST",
    formData: body,
  });

  if (!result.ok) {
    return errorState(
      result.message,
      result.fieldErrors,
    );
  }

  return successState(`${result.data.data.file_name} has been added to your vault.`);
}

export async function deleteDocumentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const documentId = String(formData.get("documentId") ?? "");

  if (!documentId) return errorState("That document could not be found.");

  const result = await api(`/documents/${documentId}`, { method: "DELETE" });

  if (!result.ok) {
    /*
     * The backend answers 404 for both "no such document" and "not yours", so
     * the message here has to cover both without distinguishing them — that
     * indistinguishability is the point of the 404.
     */
    return errorState(
      result.status === 404
        ? "That document could not be found."
        : result.message,
    );
  }

  return successState("Document deleted.");
}

/**
 * Where the browser should go to fetch a document.
 *
 * Points at the backend, not at a Next route. Proxying the download would mean
 * decrypted bytes passing through this process and its logs for no benefit —
 * the backend already authorises the caller, verifies the checksum and records
 * the access.
 */
export function documentDownloadUrl(documentId: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

  return `${base}/documents/${documentId}/download`;
}
