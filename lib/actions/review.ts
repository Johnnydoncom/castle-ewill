import { apiMutation } from "@/lib/api/browser";
import { errorState, type FormState } from "./state";

/**
 * Administrative transitions on a Will, delegated to the API.
 *
 * The state machine and its guards live in the backend
 * (`App\Services\Will\WillReviewService`), which is where they have to be: a
 * reviewer is a signed-in user like any other, and "only an approved Will may
 * be marked executed" is a rule about the record, not about the screen.
 *
 * The backend also refuses an administrator reviewing their own Will. That is
 * enforced by a policy, not by hiding a button here.
 */

async function act(
  willId: string,
  action: "start-review" | "approve" | "request-changes" | "mark-executed",
  body?: Record<string, unknown>,
): Promise<FormState> {
  if (!willId) return errorState("That Will could not be found.");

  const state = await apiMutation(`/admin/wills/${willId}/${action}`, {
    body,
    onError: (result) => ({
      status: "error",
      /*
       * An illegal transition comes back as 422 with copy the reviewer can act
       * on — "This Will is still a draft and has not been submitted for
       * review." Passed through rather than restated, so there is one wording
       * of each rule.
       *
       * A 404 means either no such Will or one the caller may not review; the
       * two are deliberately indistinguishable.
       */
      message:
        result.status === 404
          ? "That Will could not be found."
          : Object.values(result.fieldErrors ?? {})[0]?.[0] ?? result.message,
      fieldErrors: result.fieldErrors,
    }),
  });

  return state;
}

export async function startReviewAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return act(String(formData.get("willId") ?? ""), "start-review");
}

export async function approveWillAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return act(String(formData.get("willId") ?? ""), "approve");
}

export async function requestChangesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const reason = String(formData.get("reason") ?? "").trim();

  // Checked here for an immediate inline message; the backend enforces the
  // same minimum, and its verdict is the one that counts.
  if (reason.length < 10) {
    return errorState("Tell the client what needs to change.", {
      reason: ["Explain what needs to change, in at least a sentence"],
    });
  }

  return act(String(formData.get("willId") ?? ""), "request-changes", { reason });
}

export async function markExecutedAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return act(String(formData.get("willId") ?? ""), "mark-executed");
}

/* -------------------------------------------------------------------------- */
/*  Client status                                                              */
/* -------------------------------------------------------------------------- */

export async function setClientStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!userId || (status !== "active" && status !== "suspended")) {
    return errorState("That request was not valid.");
  }

  /*
   * The two refusals that matter — an administrator suspending themselves, and
   * suspending another administrator — are enforced in the backend, not here.
   * Both are foreseeable accidents rather than attacks, and both would lock the
   * registry out of its own console.
   */
  return apiMutation(`/admin/clients/${userId}/status`, {
    body: { status },
  });
}

/* -------------------------------------------------------------------------- */
/*  Verification queue                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Records a human decision on a pending liveness attempt.
 *
 * This is the screen that makes `VERIFICATION_PROVIDER=manual_review` honest
 * rather than a euphemism for "not checked". A rejection requires a reason, so
 * the client is told what to fix rather than simply refused.
 */
export async function decideVerificationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const verificationId = String(formData.get("verificationId") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!verificationId || (decision !== "approve" && decision !== "reject")) {
    return errorState("That request was not valid.");
  }

  const reason = String(formData.get("reason") ?? "").trim();

  if (decision === "reject" && reason.length < 5) {
    return errorState("Give a reason so the client knows what to correct.", {
      reason: ["A short reason is required"],
    });
  }

  return apiMutation(
    `/admin/verifications/${verificationId}/${decision}`,
    { body: decision === "reject" ? { reason } : undefined },
  );
}

/* -------------------------------------------------------------------------- */
/*  Payments                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Confirms a bank transfer.
 *
 * The only path by which a payment becomes successful without a provider saying
 * so — because for a bank transfer there is no provider to ask. The backend
 * refuses to apply it to a card payment, which would otherwise bypass the
 * amount check against the provider's own record.
 */
export async function confirmBankTransferAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const paymentId = String(
    formData.get("paymentId") ?? formData.get("reference") ?? "",
  );

  if (!paymentId) return errorState("That payment could not be found.");

  return apiMutation(
    `/admin/payments/${paymentId}/confirm-transfer`,
    { body: { note: String(formData.get("note") ?? "") || null } },
  );
}

/** Publishes the bank account clients are asked to transfer to. */
export async function setBankAccountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/admin/settings/bank-account", {
    method: "PUT",
    body: {
      bank_name: String(formData.get("bankName") ?? ""),
      account_name: String(formData.get("accountName") ?? ""),
      account_number: String(formData.get("accountNumber") ?? ""),
      instructions: String(formData.get("instructions") ?? "") || null,
    },
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors
        ? Object.fromEntries(
          Object.entries(result.fieldErrors).map(([key, messages]) => [
            key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
            messages,
          ]),
        )
        : undefined,
    }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Creates or edits a published price.
 *
 * The price is typed and posted in **naira** — what an administrator reads
 * off an invoice — and converted to kobo once, server-side, in
 * `SavePlanRequest`. Doing the multiplication here would put a second,
 * rounding-prone copy of the money boundary in the browser.
 *
 * Features arrive as one per line and are split here rather than asking an
 * administrator to type JSON.
 */
export async function savePlanAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const planId = String(formData.get("planId") ?? "");

  const body = {
    slug: String(formData.get("slug") ?? "").trim(),
    kind: String(formData.get("kind") ?? "will"),
    name: String(formData.get("name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    price_naira: Number(formData.get("priceNaira") ?? 0),
    features: String(formData.get("features") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    includes_lodging: formData.get("includesLodging") === "on",
    included_subscription_months: Number(
      formData.get("includedSubscriptionMonths") ?? 0,
    ),
    is_popular: formData.get("isPopular") === "on",
    is_active: formData.get("isActive") === "on",
    sort_order: Number(formData.get("sortOrder") ?? 0),
  };

  return apiMutation(planId ? `/admin/plans/${planId}` : "/admin/plans", {
    method: planId ? "PUT" : "POST",
    body,
    onError: (result) => ({
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors
        ? Object.fromEntries(
          Object.entries(result.fieldErrors).map(([key, messages]) => [
            key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
            messages,
          ]),
        )
        : undefined,
    }),
  });
}

/**
 * Withdraws a plan from sale, or puts it back.
 *
 * Deliberately not a delete: every payment ever made references its plan, and
 * removing the row would orphan that history.
 */
export async function setPlanAvailabilityAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const planId = String(formData.get("planId") ?? "");

  if (!planId) return errorState("That plan could not be identified.");

  return apiMutation(`/admin/plans/${planId}/availability`, {
    method: "POST",
    body: { is_active: formData.get("isActive") === "on" },
  });
}

export async function setVerificationProviderAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return apiMutation("/admin/settings/verification-provider", {
    method: "PUT",
    body: { provider: String(formData.get("provider") ?? "") },
  });
}

/* -------------------------------------------------------------------------- */
/*  Admin accounts — superadmin only                                          */
/* -------------------------------------------------------------------------- */

/** Creates a new admin account, scoped to the given sections, and emails an invitation. */
export async function createAdminAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const permissions = formData.getAll("permissions").map(String);

  if (!name || !email) {
    return errorState("Enter a name and email address.", {
      ...(name ? {} : { name: ["Required"] }),
      ...(email ? {} : { email: ["Required"] }),
    });
  }

  return apiMutation("/admin/admins", {
    body: { name, email, permissions },
  });
}

/** Replaces one admin's permission set wholesale. */
export async function updateAdminPermissionsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = String(formData.get("userId") ?? "");
  const permissions = formData.getAll("permissions").map(String);

  if (!userId) return errorState("That admin could not be found.");

  return apiMutation(`/admin/admins/${userId}/permissions`, {
    method: "PUT",
    body: { permissions },
  });
}

/** Suspends or reactivates a delegated admin account. */
export async function setAdminStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!userId || (status !== "active" && status !== "suspended")) {
    return errorState("That request was not valid.");
  }

  return apiMutation(`/admin/admins/${userId}/status`, {
    body: { status },
  });
}

/* -------------------------------------------------------------------------- */
/*  Contact messages                                                          */
/* -------------------------------------------------------------------------- */

/** Moves a contact message through new → in progress → closed. */
export async function setContactStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const messageId = String(formData.get("messageId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!messageId || !["new", "in_progress", "closed"].includes(status)) {
    return errorState("That request was not valid.");
  }

  return apiMutation(`/admin/contact-messages/${messageId}/status`, {
    body: { status },
  });
}
