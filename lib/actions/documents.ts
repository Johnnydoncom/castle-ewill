"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { documents, wills } from "@/lib/db/schema";
import type { DocumentRecord } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { buildStorageKey, removeDocument, storeDocument } from "@/lib/storage";
import { callerKey, recordAudit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/auth/rate-limit";
import { describeFileProblem } from "@/lib/documents";
import { currentUser } from "./guards";
import { errorState, successState, type FormState } from "./state";

/**
 * Document vault actions.
 *
 * Only async functions may be exported from a `"use server"` module, so the
 * constants and the shared validation helper live in `lib/documents.ts`.
 */

const uploadSchema = z.object({
  kind: z.enum([
    "identity_document",
    "passport_photograph",
    "supporting_document",
  ]),
  willId: z.string().optional(),
});

export async function uploadDocumentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  const limit = rateLimit(await callerKey(`upload:${user.id}`), 20, 60 * 60);
  if (!limit.ok) {
    return errorState(
      "You have reached the hourly upload limit. Please try again later.",
    );
  }

  const parsed = uploadSchema.safeParse({
    kind: formData.get("kind"),
    willId: formData.get("willId") || undefined,
  });
  if (!parsed.success) {
    return errorState("Choose a document type before uploading.", {
      kind: ["Select a document type"],
    });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorState("Choose a file to upload.", { file: ["Select a file"] });
  }

  // The same check runs in the browser for immediate feedback; this is the one
  // that actually decides.
  const problem = describeFileProblem(file.name, file.type, file.size);
  if (problem) {
    return errorState(problem, { file: [problem] });
  }

  // If a Will is named, confirm the caller owns it before attaching to it.
  let willId: string | null = null;
  if (parsed.data.willId) {
    const [owned] = await db
      .select({ id: wills.id })
      .from(wills)
      .where(and(eq(wills.id, parsed.data.willId), eq(wills.userId, user.id)))
      .limit(1);
    willId = owned?.id ?? null;
  }

  const body = Buffer.from(await file.arrayBuffer());
  const key = buildStorageKey(user.id, parsed.data.kind, file.name);

  let stored;
  try {
    stored = await storeDocument(key, body, file.type, {
      userId: user.id,
      kind: parsed.data.kind,
    });
  } catch (error) {
    console.error("[documents] upload failed", error);
    return errorState(
      "We could not store that file. Please try again, or contact us if the problem persists.",
    );
  }

  await db.insert(documents).values({
    id: newId(),
    userId: user.id,
    willId,
    kind: parsed.data.kind,
    fileName: file.name.slice(-255),
    mimeType: file.type,
    sizeBytes: body.byteLength,
    storageProvider: stored.provider,
    storageKey: stored.handle,
    isEncrypted: true,
    checksum: stored.checksum,
  });

  await recordAudit({
    userId: user.id,
    action: "document.uploaded",
    entityType: "document",
    metadata: { kind: parsed.data.kind, bytes: body.byteLength },
  });

  revalidatePath("/dashboard/documents");
  return successState(`${file.name} has been added to your vault.`);
}

export async function deleteDocumentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  const id = String(formData.get("documentId") ?? "");

  const [record] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .limit(1);

  if (!record) return errorState("That document could not be found.");

  // The database row is removed only after the object store confirms deletion,
  // so a storage failure cannot leave a record pointing at nothing.
  try {
    await removeDocument(record.storageKey);
  } catch (error) {
    console.error("[documents] delete failed", error);
    return errorState("We could not remove that file. Please try again.");
  }

  await db.delete(documents).where(eq(documents.id, record.id));

  await recordAudit({
    userId: user.id,
    action: "document.deleted",
    entityType: "document",
    entityId: record.id,
  });

  revalidatePath("/dashboard/documents");
  return successState(`${record.fileName} has been removed from your vault.`);
}

export async function listUserDocuments(
  userId: string,
): Promise<DocumentRecord[]> {
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}
