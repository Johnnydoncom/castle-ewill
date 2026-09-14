import { apiData } from "@/lib/api/client";

/**
 * The document vault's server-side reads.
 *
 * Nothing about a vault document is handled in this tier. Encryption, the
 * opaque storage key, the ownership check, the checksum re-verification and the
 * access log all live behind `/documents`. Upload and delete move client-side
 * (`documents.client.ts`) so the browser calls Laravel directly — for upload
 * in particular that also means the file no longer transits this Next server
 * at all.
 */

export type VaultDocumentRevision = {
  version: number;
  file_name: string;
  size_bytes: number;
  superseded_at: string | null;
};

export type VaultDocument = {
  id: string;
  document_number?: string | null;
  version?: number;
  kind: string;
  /**
   * When downloads of this document stop — set only once that is near, or has
   * happened. Downloading is what the subscription keeps: it stops when the
   * subscription covering the document ends, and renewing reopens it exactly
   * as it was. Nothing is ever deleted.
   */
  vault_access_ends_at: string | null;
  /** Whether this document can be downloaded now. False once its subscription has ended. */
  download_available?: boolean;
  /** The Will this document belongs to — and whose subscription covers it — if any. */
  will_id?: string | null;
  identity_document_type?: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  is_encrypted: boolean;
  created_at: string;
  download_url?: string;
  revisions?: VaultDocumentRevision[];
};

export async function listUserDocuments(): Promise<VaultDocument[]> {
  return apiData<VaultDocument[]>("/documents", []);
}
