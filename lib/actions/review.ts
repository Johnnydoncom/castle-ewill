"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { notifications, users, wills } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import { recordAudit } from "@/lib/security/audit";
import { sendMail } from "@/lib/mail/mailer";
import {
  willApprovedTemplate,
  willChangesRequestedTemplate,
} from "@/lib/mail/templates";
import { getFullWill, recordRevision } from "@/lib/will/repository";
import { requireAdmin } from "./guards";
import {
  errorState,
  successState,
  zodFieldErrors,
  type FormState,
} from "./state";

/**
 * Administrative transitions on a submitted Will.
 *
 * Every action re-asserts `requireAdmin()` rather than trusting that the caller
 * arrived from an admin page — a server action is a public endpoint.
 */

/** Loads the Will plus its owner. Admin scope, so ownership is not filtered. */
async function loadForReview(willId: string) {
  const will = await getFullWill(willId, null);
  if (!will) return null;

  const [owner] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, will.userId))
    .limit(1);

  return owner ? { will, owner } : null;
}

async function notify(
  userId: string,
  title: string,
  body: string,
  href: string,
): Promise<void> {
  await db.insert(notifications).values({
    id: newId(),
    userId,
    type: "will_review",
    title,
    body,
    href,
  });
}

/* -------------------------------------------------------------------------- */
/*  Approve                                                                    */
/* -------------------------------------------------------------------------- */

export async function approveWillAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const willId = String(formData.get("willId") ?? "");

  const loaded = await loadForReview(willId);
  if (!loaded) return errorState("That Will could not be found.");

  const { will, owner } = loaded;

  if (will.status === "approved" || will.status === "executed") {
    return successState("This Will has already been approved.");
  }

  if (will.status === "draft") {
    return errorState(
      "This Will is still a draft and has not been submitted for review.",
    );
  }

  await db
    .update(wills)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(wills.id, will.id));

  await recordRevision(will.id, admin.id, "Approved by reviewer");

  const url = `${getEnv().APP_URL}/dashboard/will`;

  await notify(
    owner.id,
    "Your Will has been approved",
    `Will ${will.reference} has completed review and is ready to download and sign.`,
    "/dashboard/will",
  );

  // A mail failure must not roll back an approval that is already recorded.
  try {
    await sendMail({
      to: owner.email,
      ...willApprovedTemplate(owner.name ?? "there", will.reference, url),
    });
  } catch (error) {
    console.error("[review] approval email failed", error);
  }

  await recordAudit({
    userId: admin.id,
    action: "will.approved",
    entityType: "will",
    entityId: will.id,
    metadata: { reference: will.reference },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/wills");
  revalidatePath(`/admin/wills/${will.id}`);

  return successState(`${will.reference} approved.`);
}

/* -------------------------------------------------------------------------- */
/*  Request changes                                                            */
/* -------------------------------------------------------------------------- */

const changesSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Explain what needs to change, in at least a sentence")
    .max(2000),
});

export async function requestChangesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const willId = String(formData.get("willId") ?? "");

  const parsed = changesSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return errorState(
      "Tell the client what needs to change.",
      zodFieldErrors(parsed.error.issues),
    );
  }

  const loaded = await loadForReview(willId);
  if (!loaded) return errorState("That Will could not be found.");

  const { will, owner } = loaded;

  if (will.status === "draft") {
    return errorState("This Will is already back with the client.");
  }

  // Returning to draft re-opens the wizard. The version is incremented so the
  // next submission is recorded as a distinct revision rather than overwriting.
  await db
    .update(wills)
    .set({
      status: "draft",
      version: will.version + 1,
      confirmedAccurate: false,
      submittedAt: null,
    })
    .where(eq(wills.id, will.id));

  await recordRevision(
    will.id,
    admin.id,
    `Changes requested: ${parsed.data.reason.slice(0, 200)}`,
  );

  const url = `${getEnv().APP_URL}/dashboard/will`;

  await notify(
    owner.id,
    "Changes requested on your Will",
    parsed.data.reason,
    "/dashboard/will",
  );

  try {
    await sendMail({
      to: owner.email,
      ...willChangesRequestedTemplate(
        owner.name ?? "there",
        will.reference,
        parsed.data.reason,
        url,
      ),
    });
  } catch (error) {
    console.error("[review] changes-requested email failed", error);
  }

  await recordAudit({
    userId: admin.id,
    action: "will.changes_requested",
    entityType: "will",
    entityId: will.id,
    metadata: { reference: will.reference, reason: parsed.data.reason },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/wills");
  revalidatePath(`/admin/wills/${will.id}`);

  return successState(`Changes requested on ${will.reference}.`);
}

/* -------------------------------------------------------------------------- */
/*  Mark executed                                                              */
/* -------------------------------------------------------------------------- */

export async function markExecutedAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const willId = String(formData.get("willId") ?? "");

  const loaded = await loadForReview(willId);
  if (!loaded) return errorState("That Will could not be found.");

  const { will, owner } = loaded;

  // "Executed" means signed and witnessed, which can only follow approval.
  if (will.status !== "approved") {
    return errorState(
      "Only an approved Will can be marked as executed. Approve it first.",
    );
  }

  await db
    .update(wills)
    .set({ status: "executed" })
    .where(eq(wills.id, will.id));

  await recordRevision(will.id, admin.id, "Marked as executed");

  await notify(
    owner.id,
    "Your Will has been recorded as executed",
    `Will ${will.reference} is now recorded as signed and witnessed.`,
    "/dashboard/will",
  );

  await recordAudit({
    userId: admin.id,
    action: "will.executed",
    entityType: "will",
    entityId: will.id,
    metadata: { reference: will.reference },
  });

  revalidatePath("/admin/wills");
  revalidatePath(`/admin/wills/${will.id}`);

  return successState(`${will.reference} marked as executed.`);
}

/* -------------------------------------------------------------------------- */
/*  Client status                                                              */
/* -------------------------------------------------------------------------- */

const statusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["active", "suspended"]),
});

export async function setClientStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = statusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return errorState("That request was not valid.");

  // An administrator locking themselves out is an easy accident to prevent.
  if (parsed.data.userId === admin.id) {
    return errorState("You cannot change the status of your own account.");
  }

  const [target] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1);

  if (!target) return errorState("That client could not be found.");

  if (target.role === "admin") {
    return errorState(
      "Administrator accounts cannot be suspended from this screen.",
    );
  }

  await db
    .update(users)
    .set({
      status: parsed.data.status,
      // Suspending clears any lockout so reactivation is a clean slate.
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, target.id));

  await recordAudit({
    userId: admin.id,
    action:
      parsed.data.status === "suspended"
        ? "user.suspended"
        : "user.reactivated",
    entityType: "user",
    entityId: target.id,
  });

  revalidatePath("/admin/users");

  return successState(
    parsed.data.status === "suspended"
      ? `${target.email} has been suspended.`
      : `${target.email} has been reactivated.`,
  );
}
