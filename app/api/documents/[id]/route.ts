import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { readDocument } from "@/lib/storage";
import { recordAudit } from "@/lib/security/audit";

/**
 * Streams a vault document back to its owner.
 *
 * The file is decrypted here rather than at the storage layer, and the SHA-256
 * checksum taken at upload is re-verified against the plaintext, so a document
 * altered in the object store fails loudly instead of being handed to the user.
 *
 * Responses are always sent as an attachment with a fixed `Content-Type`. Even
 * if a file lied about its media type on the way in, the browser will not
 * render or execute it on the way out.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  // Ownership is part of the query, so guessing an id returns 404 rather than
  // another client's identity document.
  const [record] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let plaintext: Buffer;
  try {
    plaintext = await readDocument(record.storageKey, record.checksum);
  } catch (error) {
    console.error("[documents] download failed", record.id, error);

    await recordAudit({
      userId: session.user.id,
      action: "document.download_failed",
      entityType: "document",
      entityId: record.id,
      metadata: {
        reason: error instanceof Error ? error.message : "unknown",
      },
    });

    return NextResponse.json(
      { error: "This document could not be retrieved or failed its integrity check." },
      { status: 502 },
    );
  }

  await recordAudit({
    userId: session.user.id,
    action: "document.downloaded",
    entityType: "document",
    entityId: record.id,
  });

  // Quote-escape the filename so a crafted name cannot break out of the header.
  const safeName = record.fileName.replace(/["\\\r\n]/g, "_");

  return new NextResponse(new Uint8Array(plaintext), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Content-Length": String(plaintext.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
