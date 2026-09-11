import { api, apiMutation } from "@/lib/api/browser";
import { collectRows, mapFieldErrors } from "@/lib/will/rows";
import { TOTAL_STEPS } from "@/lib/will/steps";
import { errorState, redirectState, type FormState } from "./state";

/**
 * The Will wizard's mutations, called directly from the browser.
 *
 * Ownership, per-section validation, the residuary-share arithmetic, the
 * witness/beneficiary conflict rule and the submission gate all live in the
 * backend. What remains here is shape translation: the wizard posts repeatable
 * rows as `executors.0.firstName`, and the API takes a JSON array of snake_case
 * objects — see `lib/will/rows.ts`.
 */

/**
 * Saves one page of the wizard and advances to the next.
 *
 * The response carries the Will's new `current_step`, so this navigates
 * straight there rather than asking for a second round trip to re-derive what
 * the first response already said.
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
    const messages = Object.values(result.fieldErrors ?? {});

    return {
      status: "error",
      /*
       * One problem is named outright — "Shares must total exactly 100%" is
       * more use than "check the form". Several are counted instead, because a
       * page asks up to four questions and naming only the first sends the
       * client hunting for the rest; each is marked beside its field.
       */
      message:
        messages.length > 1
          ? `${messages.length} answers need attention — each is marked below.`
          : (messages[0]?.[0] ?? result.message),
      fieldErrors: mapFieldErrors(result.fieldErrors),
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

function willIdOf(formData: FormData): string {
  return String(formData.get("willId") ?? "");
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — about you                                                         */
/* -------------------------------------------------------------------------- */

export async function saveAboutYouAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(willIdOf(formData), "about-you", {
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

    declared_last_will: formData.get("declaredLastWill") === "on",
    revokes_prior_wills: formData.get("revokesPriorWills") === "on",
    confirmed_sound_mind: formData.get("confirmedSoundMind") === "on",
  });
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — people and property                                               */
/* -------------------------------------------------------------------------- */

export async function saveEstateAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  /*
   * The trustee list is sent only when the executors are *not* acting, because
   * the server clears it otherwise — a Will naming two sets of trustees is a
   * Will nobody can act on.
   */
  const executorsAreTrustees = formData.get("executorsAreTrustees") === "on";

  return saveStep(willIdOf(formData), "estate", {
    executors: collectRows(formData, "executors"),

    // Each with its `id` when it already exists, and its guardian nested when
    // it is marked under eighteen.
    beneficiaries: collectRows(formData, "beneficiaries"),

    executors_are_trustees: executorsAreTrustees,
    trustees: executorsAreTrustees ? [] : collectRows(formData, "trustees"),
    trust_bank_account: formData.get("trustBankAccount") === "on",
    distribution_frequency:
      String(formData.get("distributionFrequency") ?? "") || null,

    assets: collectRows(formData, "assets"),
    assets_declared_none: formData.get("assetsDeclaredNone") === "on",
  });
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — gifts and wishes                                                  */
/* -------------------------------------------------------------------------- */

export async function saveWishesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(willIdOf(formData), "wishes", {
    /*
     * Naming gifts item by item is one instruction; leaving the whole estate
     * to the trustees is another. The server clears the second the moment a
     * gift is listed, so the two can never both be recorded.
     */
    bequests: collectRows(formData, "bequests"),
    estate_in_trust: formData.get("estateInTrust") === "on",

    // One share per beneficiary, by id.
    shares: collectRows(formData, "shares"),
    residuary_estate: formData.get("residuaryEstate"),

    funeral_preference: formData.get("funeralPreference"),
    funeral_instructions: formData.get("funeralInstructions"),
    special_instructions: formData.get("specialInstructions"),
  });
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — witnesses                                                         */
/* -------------------------------------------------------------------------- */

export async function saveWitnessesAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveStep(willIdOf(formData), "witnesses", {
    witnesses: collectRows(formData, "witnesses"),
  });
}

/* -------------------------------------------------------------------------- */
/*  Review — submit                                                            */
/* -------------------------------------------------------------------------- */

export async function submitWillAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const willId = willIdOf(formData);
  if (!willId) return errorState("That Will could not be found.");

  return apiMutation(`/wills/${willId}/submit`, {
    body: {
      confirmed_accurate: formData.get("confirmedAccurate") === "on",
      // Present only once the lodging fee for this update is paid; the server
      // refuses a requested lodging that is not.
      lodging_requested: formData.get("lodgingRequested") === "on",
    },
    /*
     * Straight on to this Will's own page, where payment now lives.
     *
     * Committing the answers is not the end of anything the client cares
     * about — they want the document — so this lands them on the next thing
     * owed rather than a "submitted, now what?" screen.
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
  const willId = willIdOf(formData);
  const step = Number(formData.get("step"));

  // An unowned Will or a nonsense step both land back on the wizard, which
  // reopens at whatever step the record itself says.
  if (!willId || !Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) {
    return redirectState("/dashboard/will");
  }

  const result = await api<{ data: { current_step: number } }>(
    `/wills/${willId}/step`,
    { method: "POST", body: { step } },
  );

  /*
   * Back to *this* Will's editor, not to the entry route. The failure case
   * keeps the id too — landing on the right document matters more when
   * something has just gone wrong, not less.
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
  const willId = willIdOf(formData);
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
  const willId = willIdOf(formData);
  const choice = String(formData.get("choice") ?? "");

  if (!willId || (choice !== "requested" && choice !== "skipped")) {
    return errorState("That request was not valid.");
  }

  return apiMutation(`/wills/${willId}/review-choice`, { body: { choice } });
}
