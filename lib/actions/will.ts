"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  beneficiaries,
  bequests,
  executors,
  faceVerifications,
  guardians,
  wills,
  witnesses,
} from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { recordAudit } from "@/lib/security/audit";
import { sendMail } from "@/lib/mail/mailer";
import { willSubmittedTemplate } from "@/lib/mail/templates";
import { getEnv } from "@/lib/env";
import type { FullWill } from "@/lib/will/repository";
import {
  getFullWill,
  refreshCompletion,
  recordRevision,
  replaceCollection,
  toCompletionInput,
} from "@/lib/will/repository";
import { canSubmit } from "@/lib/will/completion";
import { nextStep } from "@/lib/will/steps";
import {
  beneficiariesSchema,
  bequestsSchema,
  conflictingWitnesses,
  declarationSchema,
  executorsSchema,
  funeralSchema,
  guardianshipSchema,
  personalSchema,
  reviewSchema,
  witnessesSchema,
} from "@/lib/will/validation";
import { getActiveVerification } from "./verification";
import { currentUser, type SessionUser } from "./guards";
import {
  errorState,
  successState,
  zodFieldErrors,
  type FormState,
} from "./state";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type OwnedWill =
  | { ok: false; error: FormState }
  | { ok: true; user: SessionUser; will: FullWill };

/**
 * Resolves the Will being edited and asserts the caller owns it.
 * Every step action goes through this, so a forged `willId` in a form body
 * cannot reach another client's document.
 *
 * The result is an explicitly discriminated union — inference over bare object
 * literals leaves the error branch optional, which defeats narrowing.
 */
async function loadOwnedWill(willId: string): Promise<OwnedWill> {
  const user = await currentUser();
  if (!user) {
    return {
      ok: false,
      error: errorState("Your session has expired. Sign in again."),
    };
  }

  const will = await getFullWill(willId, user.id);
  if (!will) {
    return { ok: false, error: errorState("That Will could not be found.") };
  }

  if (will.status !== "draft") {
    return {
      ok: false,
      error: errorState(
        "This Will has been submitted and can no longer be edited. Create a new version to make changes.",
      ),
    };
  }

  return { ok: true, user, will };
}

/**
 * Form bodies arrive flat (`executors.0.fullName`). This rebuilds the indexed
 * rows into an ordered array, tolerating gaps left by removed entries.
 */
function collectRows(
  formData: FormData,
  prefix: string,
): Array<Record<string, string | boolean>> {
  const byIndex = new Map<number, Record<string, string | boolean>>();

  for (const [key, value] of formData.entries()) {
    const match = key.match(new RegExp(`^${prefix}\\.(\\d+)\\.(.+)$`));
    if (!match) continue;

    const index = Number(match[1]);
    const field = match[2];
    const row = byIndex.get(index) ?? {};

    row[field] =
      value === "on" ? true : typeof value === "string" ? value : String(value);
    byIndex.set(index, row);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    // Checkbox fields are absent when unticked; normalise them to false.
    .map((row) => ({
      isAlternate: false,
      isContingent: false,
      ...row,
    }));
}

async function finishStep(
  willId: string,
  step: number,
  hasMinorChildren: boolean | null,
): Promise<FormState> {
  const percent = await refreshCompletion(willId);
  const target = nextStep(step, hasMinorChildren);

  await db
    .update(wills)
    .set({ currentStep: Math.max(step, target) })
    .where(eq(wills.id, willId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/will");

  return successState("Saved.", {
    nextStep: String(target),
    completion: String(percent),
  });
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — personal details                                                  */
/* -------------------------------------------------------------------------- */

export async function savePersonalAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = personalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(
      "Please correct the highlighted fields.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await db
    .update(wills)
    .set({
      ...parsed.data,
      title: `Last Will of ${parsed.data.fullLegalName}`,
    })
    .where(eq(wills.id, willId));

  await recordAudit({
    userId: owned.user.id,
    action: "will.step_saved",
    entityType: "will",
    entityId: willId,
    metadata: { step: 1 },
  });

  return finishStep(willId, 1, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — declaration                                                       */
/* -------------------------------------------------------------------------- */

export async function saveDeclarationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const raw = Object.fromEntries(formData);
  const parsed = declarationSchema.safeParse({
    declaredLastWill: raw.declaredLastWill === "on",
    revokesPriorWills: raw.revokesPriorWills === "on",
    confirmedSoundMind: raw.confirmedSoundMind === "on",
  });

  if (!parsed.success) {
    return errorState(
      "Every declaration must be confirmed before continuing.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await db.update(wills).set(parsed.data).where(eq(wills.id, willId));
  return finishStep(willId, 2, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — executors                                                         */
/* -------------------------------------------------------------------------- */

export async function saveExecutorsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = executorsSchema.safeParse({
    executors: collectRows(formData, "executors"),
  });

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Please check the executor details.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await replaceCollection(
    executors,
    willId,
    parsed.data.executors.map((row, index) => ({
      id: newId(),
      willId,
      sortOrder: index,
      isAlternate: row.isAlternate,
      fullName: row.fullName,
      relationship: row.relationship ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
      address: row.address,
    })),
  );

  return finishStep(willId, 3, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — beneficiaries                                                     */
/* -------------------------------------------------------------------------- */

export async function saveBeneficiariesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = beneficiariesSchema.safeParse({
    beneficiaries: collectRows(formData, "beneficiaries"),
    residuaryEstate: formData.get("residuaryEstate") ?? undefined,
  });

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Please check the beneficiary details.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  // A beneficiary cannot also witness the Will — the gift would be void.
  const clash = conflictingWitnesses(
    parsed.data.beneficiaries.map((b) => b.fullName),
    owned.will.witnesses.map((w) => w.fullName),
  );
  if (clash.length > 0) {
    return errorState(
      `${clash.join(" and ")} is recorded as a witness. A gift to an attesting witness is void — remove them as a witness or as a beneficiary.`,
    );
  }

  await replaceCollection(
    beneficiaries,
    willId,
    parsed.data.beneficiaries.map((row, index) => ({
      id: newId(),
      willId,
      sortOrder: index,
      fullName: row.fullName,
      relationship: row.relationship,
      email: row.email ?? null,
      phone: row.phone ?? null,
      address: row.address ?? null,
      sharePercent: row.sharePercent.toFixed(2),
      isContingent: row.isContingent,
      notes: row.notes ?? null,
    })),
  );

  await db
    .update(wills)
    .set({ residuaryEstate: parsed.data.residuaryEstate ?? null })
    .where(eq(wills.id, willId));

  return finishStep(willId, 4, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 5 — guardianship (conditional)                                        */
/* -------------------------------------------------------------------------- */

export async function saveGuardianshipAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const hasMinorChildren = formData.get("hasMinorChildren") === "yes";

  const parsed = guardianshipSchema.safeParse({
    hasMinorChildren,
    guardians: hasMinorChildren ? collectRows(formData, "guardians") : [],
  });

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Please check the guardian details.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await db
    .update(wills)
    .set({ hasMinorChildren })
    .where(eq(wills.id, willId));

  await replaceCollection(
    guardians,
    willId,
    parsed.data.guardians.map((row, index) => ({
      id: newId(),
      willId,
      sortOrder: index,
      isAlternate: row.isAlternate,
      fullName: row.fullName,
      relationship: row.relationship ?? null,
      phone: row.phone ?? null,
      address: row.address,
      childrenCovered: row.childrenCovered ?? null,
    })),
  );

  return finishStep(willId, 5, hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 6 — specific bequests                                                 */
/* -------------------------------------------------------------------------- */

export async function saveBequestsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = bequestsSchema.safeParse({
    bequests: collectRows(formData, "bequests"),
  });

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Please check the bequest details.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await replaceCollection(
    bequests,
    willId,
    parsed.data.bequests.map((row, index) => ({
      id: newId(),
      willId,
      sortOrder: index,
      itemDescription: row.itemDescription,
      recipientName: row.recipientName,
      recipientRelationship: row.recipientRelationship ?? null,
      notes: row.notes ?? null,
    })),
  );

  return finishStep(willId, 6, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 7 — funeral wishes                                                    */
/* -------------------------------------------------------------------------- */

export async function saveFuneralAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = funeralSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(
      "Please choose a preference before continuing.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await db
    .update(wills)
    .set({
      funeralPreference: parsed.data.funeralPreference,
      funeralInstructions: parsed.data.funeralInstructions ?? null,
      specialInstructions: parsed.data.specialInstructions ?? null,
    })
    .where(eq(wills.id, willId));

  return finishStep(willId, 7, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 8 — witnesses                                                         */
/* -------------------------------------------------------------------------- */

export async function saveWitnessesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = witnessesSchema.safeParse({
    witnesses: collectRows(formData, "witnesses"),
  });

  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "Please check the witness details.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const clash = conflictingWitnesses(
    owned.will.beneficiaries.map((b) => b.fullName),
    parsed.data.witnesses.map((w) => w.fullName),
  );
  if (clash.length > 0) {
    return errorState(
      `${clash.join(" and ")} is named as a beneficiary. A witness cannot inherit under the Will — please choose an independent witness.`,
    );
  }

  await replaceCollection(
    witnesses,
    willId,
    parsed.data.witnesses.map((row, index) => ({
      id: newId(),
      willId,
      sortOrder: index,
      fullName: row.fullName,
      occupation: row.occupation ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
      address: row.address,
    })),
  );

  return finishStep(willId, 8, owned.will.hasMinorChildren);
}

/* -------------------------------------------------------------------------- */
/*  Step 9 — review & submit                                                   */
/* -------------------------------------------------------------------------- */

export async function submitWillAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const owned = await loadOwnedWill(willId);
  if (!owned.ok) return owned.error;

  const parsed = reviewSchema.safeParse({
    confirmedAccurate: formData.get("confirmedAccurate") === "on",
  });

  if (!parsed.success) {
    return errorState(
      "Confirm that your Will is accurate before submitting.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  await db
    .update(wills)
    .set({ confirmedAccurate: true })
    .where(eq(wills.id, willId));

  // Re-read so the completeness check runs against committed state.
  const refreshed = await getFullWill(willId, owned.user.id);
  if (!refreshed || !canSubmit(toCompletionInput(refreshed))) {
    return errorState(
      "Some required sections are still incomplete. Review the checklist above before submitting.",
    );
  }

  // Identity gate. Enforced here rather than in the page, so a client that
  // never renders the verification UI still cannot submit a Will.
  const verification = await getActiveVerification(owned.user.id);
  if (!verification) {
    return errorState(
      "Your identity must be verified before your Will can be submitted. Complete the face verification check above, then submit again.",
    );
  }

  await db
    .update(faceVerifications)
    .set({ willId: refreshed.id })
    .where(eq(faceVerifications.id, verification.id));

  await db
    .update(wills)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(eq(wills.id, willId));

  await recordRevision(willId, owned.user.id, "Submitted for review");

  await recordAudit({
    userId: owned.user.id,
    action: "will.submitted",
    entityType: "will",
    entityId: willId,
    metadata: { verificationId: verification.id },
  });

  if (owned.user.email) {
    await sendMail({
      to: owned.user.email,
      ...willSubmittedTemplate(
        owned.user.name,
        refreshed.reference,
        `${getEnv().APP_URL}/dashboard/will`,
      ),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/will");

  return successState("Your Will has been submitted for review.");
}

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                 */
/* -------------------------------------------------------------------------- */

const stepParam = z.coerce.number().int().min(1).max(9);

export async function goToStepAction(formData: FormData): Promise<void> {
  const willId = String(formData.get("willId") ?? "");
  const parsed = stepParam.safeParse(formData.get("step"));
  const owned = await loadOwnedWill(willId);

  if (!owned.ok || !parsed.success) {
    redirect("/dashboard/will");
  }

  await db
    .update(wills)
    .set({ currentStep: parsed.data })
    .where(eq(wills.id, willId));

  redirect(`/dashboard/will?step=${parsed.data}`);
}

/** "Save & Exit" — progress is already persisted, so this just leaves. */
export async function saveAndExitAction(): Promise<void> {
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
