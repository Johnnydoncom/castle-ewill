import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  assets,
  beneficiaries,
  bequests,
  executors,
  guardians,
  wills,
  witnesses,
  willRevisions,
} from "@/lib/db/schema";
import type {
  Asset,
  Beneficiary,
  Bequest,
  Executor,
  Guardian,
  Will,
  Witness,
} from "@/lib/db/schema";
import { newId, newWillReference } from "@/lib/ids";
import { completionPercent, type CompletionInput } from "./completion";

export type FullWill = Will & {
  executors: Executor[];
  beneficiaries: Beneficiary[];
  guardians: Guardian[];
  bequests: Bequest[];
  assets: Asset[];
  witnesses: Witness[];
};

/**
 * Loads a Will with every child collection.
 *
 * Ownership is enforced here rather than by the caller: passing `userId`
 * scopes the lookup, so a forged id in a URL returns null instead of another
 * client's document. Admin callers pass `userId: null` deliberately.
 */
export async function getFullWill(
  willId: string,
  userId: string | null,
): Promise<FullWill | null> {
  const [will] = await db
    .select()
    .from(wills)
    .where(
      userId
        ? and(eq(wills.id, willId), eq(wills.userId, userId))
        : eq(wills.id, willId),
    )
    .limit(1);

  if (!will) return null;

  const [
    executorRows,
    beneficiaryRows,
    guardianRows,
    bequestRows,
    assetRows,
    witnessRows,
  ] = await Promise.all([
    db.select().from(executors).where(eq(executors.willId, willId)).orderBy(executors.sortOrder),
    db.select().from(beneficiaries).where(eq(beneficiaries.willId, willId)).orderBy(beneficiaries.sortOrder),
    db.select().from(guardians).where(eq(guardians.willId, willId)).orderBy(guardians.sortOrder),
    db.select().from(bequests).where(eq(bequests.willId, willId)).orderBy(bequests.sortOrder),
    db.select().from(assets).where(eq(assets.willId, willId)).orderBy(assets.sortOrder),
    db.select().from(witnesses).where(eq(witnesses.willId, willId)).orderBy(witnesses.sortOrder),
  ]);

  return {
    ...will,
    executors: executorRows,
    beneficiaries: beneficiaryRows,
    guardians: guardianRows,
    bequests: bequestRows,
    assets: assetRows,
    witnesses: witnessRows,
  };
}

export async function listWillsForUser(userId: string): Promise<Will[]> {
  return db
    .select()
    .from(wills)
    .where(eq(wills.userId, userId))
    .orderBy(desc(wills.updatedAt));
}

/** Returns the user's active draft, creating one on first visit. */
export async function getOrCreateDraft(
  userId: string,
  displayName?: string | null,
): Promise<Will> {
  const [existing] = await db
    .select()
    .from(wills)
    .where(and(eq(wills.userId, userId), eq(wills.status, "draft")))
    .orderBy(desc(wills.updatedAt))
    .limit(1);

  if (existing) return existing;

  const id = newId();
  await db.insert(wills).values({
    id,
    userId,
    reference: await allocateReference(),
    title: displayName ? `Last Will of ${displayName}` : "Last Will and Testament",
    status: "draft",
    currentStep: 1,
  });

  const [created] = await db.select().from(wills).where(eq(wills.id, id)).limit(1);
  return created;
}

/**
 * Allocates a unique document number, retrying on the (rare) collision of the
 * random suffix rather than trusting a single roll.
 */
async function allocateReference(attempt = 0): Promise<string> {
  if (attempt >= 5) {
    throw new Error("Unable to allocate a unique Will reference");
  }
  const candidate = newWillReference();
  const [clash] = await db
    .select({ id: wills.id })
    .from(wills)
    .where(eq(wills.reference, candidate))
    .limit(1);
  return clash ? allocateReference(attempt + 1) : candidate;
}

export function toCompletionInput(will: FullWill): CompletionInput {
  return {
    fullLegalName: will.fullLegalName,
    dateOfBirth: will.dateOfBirth,
    addressLine1: will.addressLine1,
    city: will.city,
    state: will.state,
    declaredLastWill: will.declaredLastWill,
    revokesPriorWills: will.revokesPriorWills,
    confirmedSoundMind: will.confirmedSoundMind,
    hasMinorChildren: will.hasMinorChildren,
    funeralPreference: will.funeralPreference,
    confirmedAccurate: will.confirmedAccurate,
    executorCount: will.executors.length,
    beneficiaryCount: will.beneficiaries.length,
    guardianCount: will.guardians.length,
    bequestCount: will.bequests.length,
    witnessCount: will.witnesses.length,
  };
}

/** Recomputes and persists the completion percentage after any step save. */
export async function refreshCompletion(willId: string): Promise<number> {
  const will = await getFullWill(willId, null);
  if (!will) return 0;

  const percent = completionPercent(toCompletionInput(will));

  await db
    .update(wills)
    .set({ completionPercent: percent })
    .where(eq(wills.id, willId));

  return percent;
}

/**
 * Replaces a child collection wholesale.
 *
 * The wizard sends the full list for a step, so a delete-then-insert inside a
 * transaction is both simpler and less error-prone than diffing rows, and it
 * keeps `sortOrder` contiguous.
 */
export async function replaceCollection<T extends Record<string, unknown>>(
  table: typeof executors | typeof beneficiaries | typeof guardians | typeof bequests | typeof assets | typeof witnesses,
  willId: string,
  rows: T[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(table).where(eq(table.willId, willId));
    if (rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.insert(table).values(rows as any);
    }
  });
}

/** Snapshots the Will so every submitted version can be reproduced later. */
export async function recordRevision(
  willId: string,
  changedByUserId: string,
  summary: string,
): Promise<void> {
  const will = await getFullWill(willId, null);
  if (!will) return;

  await db.insert(willRevisions).values({
    id: newId(),
    willId,
    version: will.version,
    snapshot: will as unknown as Record<string, unknown>,
    summary,
    changedByUserId,
  });
}

export async function countWillsByStatus(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: wills.status, count: sql<number>`count(*)` })
    .from(wills)
    .groupBy(wills.status);

  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]));
}
