"use server";

import { and, desc, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { documents, faceVerifications } from "@/lib/db/schema";
import type { FaceVerification } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { buildStorageKey, readDocument, storeDocument } from "@/lib/storage";
import { callerKey, recordAudit } from "@/lib/security/audit";
import { rateLimit } from "@/lib/auth/rate-limit";
import {
  ALL_CHALLENGES,
  getVerificationProvider,
  pickChallenges,
  type LivenessChallenge,
} from "@/lib/verification";
import { currentUser } from "./guards";
import { errorState, successState, type FormState } from "./state";

/** A passed verification is good for this long before it must be redone. */
const VALID_FOR_MINUTES = 60;

const MAX_CAPTURE_BYTES = 4 * 1024 * 1024;

/**
 * Issues a randomised challenge sequence and opens a pending attempt.
 *
 * The sequence is generated and stored **server-side**. If the browser chose
 * its own challenges, an attacker could simply pick the one they had already
 * recorded.
 */
export async function startVerificationAction(): Promise<
  | { status: "error"; message: string }
  | { status: "success"; attemptId: string; challenges: LivenessChallenge[] }
> {
  const user = await currentUser();
  if (!user) {
    return { status: "error", message: "Your session has expired." };
  }

  const limit = rateLimit(await callerKey(`verify-start:${user.id}`), 10, 60 * 60);
  if (!limit.ok) {
    return {
      status: "error",
      message: "Too many verification attempts. Please try again later.",
    };
  }

  const challenges = pickChallenges(3);
  const id = newId();

  await db.insert(faceVerifications).values({
    id,
    userId: user.id,
    status: "pending",
    provider: getVerificationProvider().name,
    challenges,
    expiresAt: new Date(Date.now() + 10 * 60_000),
  });

  return { status: "success", attemptId: id, challenges };
}

const submitSchema = z.object({
  attemptId: z.string().min(1),
  completed: z.array(z.enum(ALL_CHALLENGES as unknown as [string, ...string[]])),
});

/**
 * Completes an attempt: stores the capture encrypted, asks the provider for a
 * decision, and records it.
 */
export async function submitVerificationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  if (!user) return errorState("Your session has expired. Sign in again.");

  const limit = rateLimit(await callerKey(`verify:${user.id}`), 10, 60 * 60);
  if (!limit.ok) {
    return errorState("Too many verification attempts. Please try again later.");
  }

  const parsed = submitSchema.safeParse({
    attemptId: formData.get("attemptId"),
    completed: formData.getAll("completed").map(String),
  });
  if (!parsed.success) return errorState("That verification attempt was not valid.");

  const [attempt] = await db
    .select()
    .from(faceVerifications)
    .where(
      and(
        eq(faceVerifications.id, parsed.data.attemptId),
        eq(faceVerifications.userId, user.id),
        eq(faceVerifications.status, "pending"),
      ),
    )
    .limit(1);

  if (!attempt) {
    return errorState("That attempt has expired. Please start again.");
  }

  if (attempt.expiresAt && attempt.expiresAt < new Date()) {
    await db
      .update(faceVerifications)
      .set({ status: "expired" })
      .where(eq(faceVerifications.id, attempt.id));
    return errorState("That attempt timed out. Please start again.");
  }

  const capture = formData.get("capture");
  if (!(capture instanceof File) || capture.size === 0) {
    return errorState("No image was captured. Please allow camera access and retry.");
  }
  if (capture.size > MAX_CAPTURE_BYTES) {
    return errorState("The captured image was too large. Please try again.");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(capture.type)) {
    return errorState("The capture was not a valid image.");
  }

  const issued = (attempt.challenges ?? []) as LivenessChallenge[];
  const completed = parsed.data.completed as LivenessChallenge[];

  const body = Buffer.from(await capture.arrayBuffer());

  // Store the frame encrypted, and keep it whatever the outcome — a failed
  // attempt is exactly what an investigator would want to look at later.
  const stored = await storeDocument(
    buildStorageKey(user.id, "verification", `${attempt.id}.jpg`),
    body,
    capture.type,
    { userId: user.id, kind: "face_verification" },
  );

  const documentId = newId();
  await db.insert(documents).values({
    id: documentId,
    userId: user.id,
    willId: attempt.willId,
    kind: "supporting_document",
    fileName: `verification-${attempt.id}.jpg`,
    mimeType: capture.type,
    sizeBytes: body.byteLength,
    storageProvider: stored.provider,
    storageKey: stored.handle,
    isEncrypted: true,
    checksum: stored.checksum,
  });

  // The most recent identity document, for providers that match against it.
  const [idDoc] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.userId, user.id),
        eq(documents.kind, "identity_document"),
      ),
    )
    .orderBy(desc(documents.createdAt))
    .limit(1);

  let idDocument: { buffer: Buffer; mimeType: string } | null = null;
  if (idDoc) {
    try {
      idDocument = {
        buffer: await readDocument(idDoc.storageKey, idDoc.checksum),
        mimeType: idDoc.mimeType,
      };
    } catch (error) {
      console.error("[verification] could not read ID document", error);
    }
  }

  const provider = getVerificationProvider();

  let outcome;
  try {
    outcome = await provider.verify({
      userId: user.id,
      capture: body,
      captureMimeType: capture.type,
      idDocument,
      challenges: issued,
      completedChallenges: completed,
    });
  } catch (error) {
    console.error("[verification] provider error", error);
    await db
      .update(faceVerifications)
      .set({
        status: "failed",
        failureReason: "The verification service could not be reached.",
        captureDocumentId: documentId,
        completedChallenges: completed,
      })
      .where(eq(faceVerifications.id, attempt.id));

    return errorState(
      "We could not complete verification just now. Please try again shortly.",
    );
  }

  await db
    .update(faceVerifications)
    .set({
      status: outcome.status,
      matchScore: outcome.matchScore ?? null,
      livenessScore: outcome.livenessScore ?? null,
      providerReference: outcome.providerReference ?? null,
      failureReason: outcome.failureReason ?? null,
      captureDocumentId: documentId,
      completedChallenges: completed,
      expiresAt:
        outcome.status === "passed"
          ? new Date(Date.now() + VALID_FOR_MINUTES * 60_000)
          : attempt.expiresAt,
    })
    .where(eq(faceVerifications.id, attempt.id));

  await recordAudit({
    userId: user.id,
    action: `verification.${outcome.status}`,
    entityType: "face_verification",
    entityId: attempt.id,
    metadata: {
      provider: provider.name,
      challenges: issued,
      completed,
      matchScore: outcome.matchScore ?? null,
    },
  });

  revalidatePath("/dashboard/will");

  if (outcome.status === "failed") {
    return errorState(
      outcome.failureReason ??
        "We could not verify your identity. Please try again.",
    );
  }

  if (outcome.status === "pending") {
    return successState(
      "Your verification has been recorded and is awaiting review. You can submit your Will once it is approved.",
    );
  }

  return successState("Identity verified. You can now submit your Will.");
}

/**
 * The gate. Returns the verification that permits submission, or null.
 *
 * Called from `submitWillAction` — not from the page — so that a client which
 * skips the UI entirely still cannot submit.
 */
export async function getActiveVerification(
  userId: string,
): Promise<FaceVerification | null> {
  const [record] = await db
    .select()
    .from(faceVerifications)
    .where(
      and(
        eq(faceVerifications.userId, userId),
        eq(faceVerifications.status, "passed"),
        gt(faceVerifications.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(faceVerifications.createdAt))
    .limit(1);

  return record ?? null;
}

/** Latest attempt of any status, for rendering the current state to the user. */
export async function getLatestVerification(
  userId: string,
): Promise<FaceVerification | null> {
  const [record] = await db
    .select()
    .from(faceVerifications)
    .where(eq(faceVerifications.userId, userId))
    .orderBy(desc(faceVerifications.createdAt))
    .limit(1);

  return record ?? null;
}
