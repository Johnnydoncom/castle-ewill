import { api, apiMutation } from "@/lib/api/browser";
import { errorState, redirectState, type FormState } from "./state";

/**
 * The nine-step wizard's mutations, called directly from the browser.
 *
 * Ownership, per-step validation, the beneficiary-share arithmetic, the
 * witness/beneficiary conflict rule and the submission gate all live in the
 * backend. What remains here is shape translation: the wizard posts repeatable
 * rows as `executors.0.fullName`, and the API takes a JSON array of snake_case
 * objects.
 *
 * The exported signatures are unchanged from the server-action versions, so
 * every form consuming them through `useActionState` still works untouched —
 * only the import path moved, from `./will` to here.
 */

/* -------------------------------------------------------------------------- */
/*  Row collection                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reassembles `executors.0.fullName` style fields into an ordered array.
 *
 * Indices are read from the field names rather than assumed contiguous: the
 * wizard lets a middle row be removed without renumbering the ones below, so
 * `0, 2, 3` is a normal submission and collapsing it blindly would drop a row.
 * Keys are converted to snake_case on the way out to match the API.
 */
function collectRows(
  formData: FormData,
  prefix: string,
): Array<Record<string, unknown>> {
  const rows = new Map<number, Record<string, unknown>>();

  for (const [key, value] of formData.entries()) {
    const match = key.match(new RegExp(`^${prefix}\\.(\\d+)\\.(.+)$`));
    if (!match) continue;

    const index = Number(match[1]);
    const field = toSnakeCase(match[2]);
    const row = rows.get(index) ?? {};

    // Checkbox inputs post "on"; the API expects a real boolean.
    row[field] = field.startsWith("is_")
      ? value === "on" || value === "true"
      : String(value);

    rows.set(index, row);
  }

  return [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row);
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Translates the API's snake_case field errors back onto the wizard's field
 * names, so an error on `executors.0.full_name` highlights the right input.
 */
function mapRowErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;

  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [
      key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      messages,
    ]),
  );
}

/**
 * Saves a step and advances the wizard.
 *
 * `WillStepController::finish()` already returns the Will's new
 * `current_step` in the same response that confirms the save — so this
 * navigates straight there instead of asking `useFormAction`'s default
 * `router.refresh()` to make a *second* round trip just to re-derive what
 * the first response already told us. That second round trip is what read
 * as "fill it in, submit, and nothing happens": against a backend on a
 * different host from the frontend, it could take long enough that the step
 * genuinely hadn't advanced yet by the time someone gave up watching.
 */
async function saveStep(
  willId: string,
  slug: string,
  body: Record<string, unknown>,
): Promise<FormState> {
  if (!willId) return errorState("That Will could not be found.");

  const result = await api<{ data: { current_step: number } }>(
    `/wills/${willId}/steps/${slug}`,
    { method: "PUT", body },
  );

  if (!result.ok) {
    return {
      status: "error",
      /*
       * The backend's first field message is the actionable one — "Primary
       * beneficiary shares must total exactly 100%" rather than a generic
       * "check the form". Falling back to the envelope message covers the
       * cross-field rules, which have no single field to attach to.
       */
      message: Object.values(result.fieldErrors ?? {})[0]?.[0] ?? result.message,
      fieldErrors: mapRowErrors(result.fieldErrors),
    };
  }

  /*
   * Back to this Will's own editor. Redirecting to `/dashboard/will` resolved
   * whichever Will was in flight, so saving a step on one Will could move the
   * client onto another between steps.
   */
  return redirectState(
    `/dashboard/wills/${willId}/edit?step=${result.data.data.current_step}`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Steps 1–8                                                                  */
/* -------------------------------------------------------------------------- */

export async function savePersonalAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "personal", {
    // The parts; `full_legal_name` is composed from them server-side.
    first_name: formData.get("firstName"),
    middle_name: formData.get("middleName"),
    last_name: formData.get("lastName"),
    date_of_birth: formData.get("dateOfBirth"),
    nationality: formData.get("nationality"),
    marital_status: formData.get("maritalStatus"),
    occupation: formData.get("occupation"),
    national_id: formData.get("nationalId"),
    address_line1: formData.get("addressLine1"),
    address_line2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
}

export async function saveDeclarationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "declaration", {
    declared_last_will: formData.get("declaredLastWill") === "on",
    revokes_prior_wills: formData.get("revokesPriorWills") === "on",
    confirmed_sound_mind: formData.get("confirmedSoundMind") === "on",
  });
}

export async function saveExecutorsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "executors", {
    executors: collectRows(formData, "executors"),
  });
}

export async function saveBeneficiariesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "beneficiaries", {
    beneficiaries: collectRows(formData, "beneficiaries"),
    residuary_estate: formData.get("residuaryEstate"),
  });
}

export async function saveGuardianshipAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "guardianship", {
    has_minor_children: formData.get("hasMinorChildren") === "yes",
    guardians: collectRows(formData, "guardians"),
  });
}

export async function saveBequestsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  /*
   * The other answer to "who gets what", not the absence of one.
   *
   * Naming gifts item by item is one instruction; leaving the whole estate to
   * the trustees to hold for the beneficiaries on their existing shares is
   * another. The server clears this the moment a gift is listed, so the two
   * can never both be recorded.
   */
  return saveStep(String(formData.get("willId") ?? ""), "bequests", {
    bequests: collectRows(formData, "bequests"),
    estate_in_trust: formData.get("estateInTrust") === "on",
  });
}

/** Everything the testator owns, listed before any of it is given away. */
export async function saveAssetsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "assets", {
    assets: collectRows(formData, "assets"),
    assets_declared_none: formData.get("assetsDeclaredNone") === "on",
  });
}

/**
 * Who holds the estate in trust, and on what terms.
 *
 * The trustee list is sent only when the executors are *not* acting, because
 * the server clears it otherwise — a Will naming two sets of trustees is a
 * Will nobody can act on.
 */
export async function saveTrusteesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const executorsAreTrustees = formData.get("executorsAreTrustees") === "on";

  return saveStep(String(formData.get("willId") ?? ""), "trustees", {
    executors_are_trustees: executorsAreTrustees,
    trustees: executorsAreTrustees ? [] : collectRows(formData, "trustees"),
    trust_bank_account: formData.get("trustBankAccount") === "on",
    distribution_frequency:
      String(formData.get("distributionFrequency") ?? "") || null,
  });
}

export async function saveFuneralAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "funeral", {
    funeral_preference: formData.get("funeralPreference"),
    funeral_instructions: formData.get("funeralInstructions"),
    special_instructions: formData.get("specialInstructions"),
  });
}

export async function saveWitnessesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(String(formData.get("willId") ?? ""), "witnesses", {
    witnesses: collectRows(formData, "witnesses"),
  });
}

/* -------------------------------------------------------------------------- */
/*  Step 9 — submit                                                            */
/* -------------------------------------------------------------------------- */

export async function submitWillAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  if (!willId) return errorState("That Will could not be found.");

  return apiMutation(`/wills/${willId}/submit`, {
    body: { confirmed_accurate: formData.get("confirmedAccurate") === "on" },
    /*
     * Straight on to this Will's own page, where payment now lives.
     *
     * Committing the answers is not the end of anything the client cares
     * about — they want the document — so this lands them on the next thing
     * owed rather than a "submitted, now what?" screen. It used to point at
     * the global billing page, which no longer takes Will payments and could
     * not have known which Will was meant anyway.
     */
    redirect: `/dashboard/wills/${willId}`,
    onError: (result) => ({
      status: "error",
      /*
       * `incomplete` comes back with copy the user can act on. Passing the
       * backend's message through keeps one description of the rule rather
       * than two that drift apart.
       */
      message: result.message,
      data: result.code ? { code: result.code } : undefined,
    }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export async function goToStepAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const step = Number(formData.get("step"));

  // An unowned Will or a nonsense step both land back on the wizard, which
  // reopens at whatever step the record itself says.
  if (!willId || !Number.isInteger(step) || step < 1 || step > 9) {
    return redirectState("/dashboard/will");
  }

  const result = await api<{ data: { current_step: number } }>(
    `/wills/${willId}/step`,
    { method: "POST", body: { step } },
  );

  /*
   * Back to *this* Will's editor, not to the entry route.
   *
   * Redirecting to `/dashboard/will` resolved whichever Will was in flight, so
   * paging through the wizard on one Will could silently move a client onto
   * another. The failure case keeps the id too — landing on the right document
   * matters more when something has just gone wrong, not less.
   */
  const editor = `/dashboard/wills/${willId}/edit`;

  if (!result.ok) return redirectState(editor);

  return redirectState(`${editor}?step=${result.data.data.current_step}`);
}

/** "Save & Exit" — progress is already persisted, so this just leaves. */
export async function saveAndExitAction(): Promise<FormState> {
  return redirectState("/dashboard", "Your progress is saved.");
}

/* -------------------------------------------------------------------------- */
/*  Life events                                                                */
/* -------------------------------------------------------------------------- */

export type LifeEventType = "marriage" | "birth_of_child" | "property_acquisition";

/**
 * Tells us about a marriage, a birth, or a property acquisition — the
 * client-triggered reason to review a Will sooner than the annual reminder.
 */
export async function recordLifeEventAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const eventType = String(formData.get("eventType") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!willId) return errorState("That Will could not be found.");

  return apiMutation(`/wills/${willId}/life-events`, {
    body: { event_type: eventType, note: note || undefined },
  });
}

/* -------------------------------------------------------------------------- */
/*  Legal review — the one optional stage                                      */
/* -------------------------------------------------------------------------- */

/**
 * Requests a lawyer's review, or skips it.
 *
 * Skipping is a first-class answer, not an escape hatch: this platform exists
 * so people can write and print their own Will, and a solicitor's read is a
 * paid extra. The choice is recorded either way so "declined" stays
 * distinguishable from "not yet asked".
 */
export async function chooseReviewAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = String(formData.get("willId") ?? "");
  const choice = String(formData.get("choice") ?? "");

  if (!willId || (choice !== "requested" && choice !== "skipped")) {
    return errorState("That request was not valid.");
  }

  return apiMutation(`/wills/${willId}/review-choice`, { body: { choice } });
}
