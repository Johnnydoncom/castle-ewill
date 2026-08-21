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
   * When the vault closes on this document; null while it stays open.
   *
   * Null whenever the client subscribes. Nothing is ever deleted — access is
   * closed, and subscribing again reopens it exactly as it was.
   */
  vault_access_ends_at: string | null;
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
