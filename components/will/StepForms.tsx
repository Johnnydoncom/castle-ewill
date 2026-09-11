"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { useFormAction } from "@/hooks/use-api-form";
import { type FormState } from "@/lib/actions/state";
import { type ApiWill, type WillPerson } from "@/lib/actions/will";
import {
  saveAboutYouAction,
  saveEstateAction,
  saveWishesAction,
  saveWitnessesAction,
  submitWillAction,
} from "@/lib/actions/will.client";
import { NIGERIAN_STATES } from "@/lib/will/reference";
import {
  sectionBySlug,
  stepForSection,
  type WillSectionSlug,
} from "@/lib/will/steps";
import {
  CheckboxField,
  RadioCards,
  SelectField,
  TextArea,
  TextField,
} from "./Fields";
import { PassportPhotoField } from "./PassportPhotoField";
import { RepeatableList } from "./RepeatableList";
import { AmendmentIdentityCheck } from "./AmendmentIdentityCheck";
import { HelpPanel, StepBanner, WizardFooter } from "./WizardChrome";

type StepProps = {
  will: ApiWill;
  backHref?: string;
  /**
   * The photograph already on file, if there is one.
   *
   * Only the first step uses it. The photograph is printed on the face of the
   * Will, so it belongs among the personal details — a field beside the name
   * and the address rather than a panel of its own.
   */
  passportPhotoId?: string | null;
  /**
   * Whether the testator is the account holder.
   *
   * True for everybody but a lawyer, and it makes the name a fact rather than
   * a question: it is the name this account was opened in and the name their
   * identity is checked against, so the wizard shows it instead of inviting a
   * spelling that would differ from the register's.
   */
  nameIsTheirs?: boolean;
  /**
   * The account holder's name, as a fallback for a Will that has none.
   *
   * A Will drafted before the name was carried over from the account has
   * nothing in these columns, and a read-only field showing nothing is worse
   * than one showing the truth: there is no way to type into it. The server
   * writes the same name on save, so this shows what is about to be stored
   * rather than a guess.
   */
  accountName?: { first: string; middle: string; last: string };
};

/** What every section's fields need: the Will, and the last submission. */
type FieldsProps = { will: ApiWill; state: FormState };

const stateOptions = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

/** Mirrors `App\Models\Asset::TYPES`. */
const ASSET_TYPES = [
  { value: "real_estate", label: "Land or building" },
  { value: "vehicle", label: "Vehicle" },
  { value: "bank_account", label: "Bank account" },
  { value: "shares", label: "Shares or investments" },
  { value: "business", label: "Business interest" },
  { value: "insurance", label: "Insurance policy" },
  { value: "digital", label: "Digital asset" },
  { value: "other", label: "Personal effects, jewellery, other" },
] as const;

function WillId({ id }: { id: string }) {
  return <input type="hidden" name="willId" value={id} />;
}

/*
 * React resets a `<form action={fn}>`'s uncontrolled fields once the action
 * settles — including on a validation error, since React only sees a
 * resolved promise, not our `status: "error"`. `state.values` (populated by
 * `useFormAction`) carries back exactly what was submitted, so preferring it
 * over the original server value makes that reset land on what the user
 * just typed instead of wiping it. See `FormState.values`.
 */
function fieldValue(state: FormState, name: string, fallback: string): string {
  return state.values?.[name] ?? fallback;
}

function fieldChecked(state: FormState, name: string, fallback: boolean): boolean {
  return state.values ? state.values[name] === "on" : fallback;
}

/**
 * A person's name, in the three parts a verification needs.
 *
 * One "full name" box is fine for printing and useless for checking: an ID
 * authority is asked about a surname and a given name, so a name typed as one
 * string has to be guessed apart before it can be sent — and that guess is
 * what turns a valid ID into a "No Match".
 *
 * The middle name is optional because plenty of people have none, and asking
 * for one as though it were required is how somebody invents one.
 */
function NameFields({
  name,
  row,
  state,
  placeholder,
}: {
  name: (field: string) => string;
  row?: {
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
  };
  state: FormState;
  /** An example whole name, split across the three boxes. */
  placeholder?: string;
}) {
  const example = (placeholder ?? "").split(" ");

  return (
    <>
      <TextField
        label="First name"
        name={name("firstName")}
        required
        placeholder={example[0] ?? ""}
        defaultValue={fieldValue(state, name("firstName"), row?.first_name ?? "")}
        errors={state.fieldErrors?.[name("firstName")]}
      />
      <TextField
        label="Middle name"
        name={name("middleName")}
        placeholder="Optional"
        defaultValue={fieldValue(state, name("middleName"), row?.middle_name ?? "")}
        errors={state.fieldErrors?.[name("middleName")]}
      />
      <TextField
        label="Surname"
        name={name("lastName")}
        required
        placeholder={example.at(-1) ?? ""}
        defaultValue={fieldValue(state, name("lastName"), row?.last_name ?? "")}
        errors={state.fieldErrors?.[name("lastName")]}
      />
    </>
  );
}

/**
 * One question on a page: its title, its explanation, and any problem with the
 * question as a whole — "shares must total 100%" belongs to no single field.
 */
function Section({
  slug,
  errors,
  children,
}: {
  slug: WillSectionSlug;
  errors?: string[];
  children: React.ReactNode;
}) {
  const section = sectionBySlug(slug);

  /*
    Titled only when it shares its page. A step asking one thing already has
    that thing's name in the heading above, and printing it twice is the
    repetition this wizard was just rid of.
  */
  const titled = stepForSection(slug).sections.length > 1;

  return (
    <section
      aria-labelledby={titled ? `section-${slug}` : undefined}
      className="space-y-6"
    >
      {titled && (
        <h2
          id={`section-${slug}`}
          className="border-b border-border pb-3 font-serif text-2xl tracking-tight text-navy"
        >
          {section.title}
        </h2>
      )}

      <HelpPanel>{section.help}</HelpPanel>

      {errors?.length ? (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-navy"
        >
          {errors[0]}
        </p>
      ) : null}

      {children}
    </section>
  );
}

/** A page of the wizard: its sections, and one Save & continue for all of them. */
function StepForm({
  will,
  state,
  action,
  backHref,
  children,
}: {
  will: ApiWill;
  state: FormState;
  action: (formData: FormData) => void;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="space-y-14" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />

      {children}

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ================================ Step 1 ================================= */

export function AboutYouStep({
  will,
  backHref,
  passportPhotoId = null,
  nameIsTheirs = true,
  accountName,
}: StepProps) {
  const [state, action] = useFormAction(saveAboutYouAction, { refresh: false });
  const e = state.fieldErrors;

  return (
    <StepForm will={will} state={state} action={action} backHref={backHref}>
      <Section slug="personal">
        <div className="grid gap-6 sm:grid-cols-2">
          {/*
            A field, not a panel. It saves on selection, so there is nothing to
            press and nothing to forget to press before moving on.
          */}
          <PassportPhotoField documentId={passportPhotoId} />

          {/*
            For everybody but a lawyer the name is not a question: the account
            holder is the testator, so it comes from the account and is shown
            rather than asked for. The server replaces whatever is submitted,
            so an editable field here could only mislead.
          */}
          {nameIsTheirs && (
            <p className="text-sm leading-relaxed text-muted-foreground sm:col-span-2">
              Your Will is made in the name on your account, which is the name
              your identity is checked against. To correct it, change it in{" "}
              <Link
                href="/dashboard/settings"
                className="text-navy underline decoration-gold underline-offset-4"
              >
                account settings
              </Link>
              .
            </p>
          )}

          <TextField
            label="First name"
            name="firstName"
            placeholder="Ada"
            hint={nameIsTheirs ? "From your account" : "As on their ID"}
            required
            readOnly={nameIsTheirs}
            defaultValue={fieldValue(
              state,
              "firstName",
              will.personal.first_name || (nameIsTheirs ? (accountName?.first ?? "") : ""),
            )}
            errors={e?.firstName}
          />
          <TextField
            label="Middle name"
            name="middleName"
            placeholder="Optional"
            hint={nameIsTheirs ? "From your account" : undefined}
            readOnly={nameIsTheirs}
            defaultValue={fieldValue(
              state,
              "middleName",
              will.personal.middle_name || (nameIsTheirs ? (accountName?.middle ?? "") : ""),
            )}
            errors={e?.middleName}
          />
          <TextField
            label="Surname"
            name="lastName"
            placeholder="Okafor"
            hint={nameIsTheirs ? "From your account" : "As on their ID"}
            required
            readOnly={nameIsTheirs}
            defaultValue={fieldValue(
              state,
              "lastName",
              will.personal.last_name || (nameIsTheirs ? (accountName?.last ?? "") : ""),
            )}
            errors={e?.lastName}
            className="sm:col-span-2"
          />
          <TextField
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            required
            defaultValue={fieldValue(state, "dateOfBirth", will.personal.date_of_birth ?? "")}
            errors={e?.dateOfBirth}
          />
          <SelectField
            label="Marital status"
            name="maritalStatus"
            required
            defaultValue={fieldValue(state, "maritalStatus", will.personal.marital_status ?? "")}
            errors={e?.maritalStatus}
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "divorced", label: "Divorced" },
              { value: "widowed", label: "Widowed" },
            ]}
          />
          <TextField
            label="Nationality"
            name="nationality"
            required
            defaultValue={fieldValue(state, "nationality", will.personal.nationality ?? "Nigerian")}
            errors={e?.nationality}
          />
          <TextField
            label="Occupation"
            name="occupation"
            placeholder="Architect"
            defaultValue={fieldValue(state, "occupation", will.personal.occupation ?? "")}
            errors={e?.occupation}
          />
          {/*
            Required. People share names far more often than a National
            Identification Number, so this is what ties the Will to one person.
          */}
          <TextField
            label="National Identification Number"
            name="nationalId"
            hint="11 digits"
            required
            placeholder="12345678901"
            defaultValue={fieldValue(state, "nationalId", will.personal.national_id ?? "")}
            errors={e?.nationalId}
            className="sm:col-span-2"
          />
          <TextField
            label="Residential address"
            name="addressLine1"
            placeholder="12 Bourdillon Road"
            required
            defaultValue={fieldValue(state, "addressLine1", will.personal.address_line1 ?? "")}
            errors={e?.addressLine1}
            className="sm:col-span-2"
          />
          <TextField
            label="Address line 2"
            name="addressLine2"
            hint="Optional"
            defaultValue={fieldValue(state, "addressLine2", will.personal.address_line2 ?? "")}
            errors={e?.addressLine2}
            className="sm:col-span-2"
          />
          <TextField
            label="City"
            name="city"
            placeholder="Ikoyi"
            required
            defaultValue={fieldValue(state, "city", will.personal.city ?? "")}
            errors={e?.city}
          />
          <SelectField
            label="State"
            name="state"
            required
            defaultValue={fieldValue(state, "state", will.personal.state ?? "")}
            errors={e?.state}
            options={stateOptions}
          />
        </div>
      </Section>

      <Section slug="declaration">
        <div className="space-y-5 border border-border bg-background p-6">
          <CheckboxField
            name="declaredLastWill"
            defaultChecked={fieldChecked(state, "declaredLastWill", will.declaration.declared_last_will)}
            errors={e?.declaredLastWill}
          >
            I declare this document to be my <strong>Last Will and Testament</strong>.
          </CheckboxField>
          <CheckboxField
            name="revokesPriorWills"
            defaultChecked={fieldChecked(state, "revokesPriorWills", will.declaration.revokes_prior_wills)}
            errors={e?.revokesPriorWills}
          >
            I revoke all Wills, codicils and testamentary dispositions previously
            made by me.
          </CheckboxField>
          <CheckboxField
            name="confirmedSoundMind"
            defaultChecked={fieldChecked(state, "confirmedSoundMind", will.declaration.confirmed_sound_mind)}
            errors={e?.confirmedSoundMind}
          >
            I am of sound mind, memory and understanding, and of full legal age.
          </CheckboxField>
        </div>
      </Section>
    </StepForm>
  );
}

/* ================================ Step 2 ================================= */

export function EstateStep({ will, backHref }: StepProps) {
  const [state, action] = useFormAction(saveEstateAction, { refresh: false });
  const e = state.fieldErrors;

  return (
    <StepForm will={will} state={state} action={action} backHref={backHref}>
      <Section slug="executors" errors={e?.executors}>
        <ExecutorsFields will={will} state={state} />
      </Section>

      <Section slug="beneficiaries" errors={e?.beneficiaries}>
        <BeneficiariesFields will={will} state={state} />
      </Section>

      <Section slug="trustees" errors={e?.trustees}>
        <TrusteesFields will={will} state={state} />
      </Section>

      <Section slug="assets" errors={e?.assets}>
        <AssetsFields will={will} state={state} />
      </Section>
    </StepForm>
  );
}

function ExecutorsFields({ will, state }: FieldsProps) {
  return (
    <RepeatableList
      legend="Executor"
      prefix="executors"
      addLabel="Add another executor"
      /*
        Two, not one. A Will with a single executor has a single point of
        failure: if that person dies first, cannot act or declines, the estate
        goes to the court for an administrator nobody chose. The server
        enforces the same minimum.
      */
      min={2}
      max={6}
      initialCount={Math.max(will.executors.length, 2)}
      renderRow={({ name, source }) => {
        const row = source === null ? undefined : will.executors[source];

        return (
          <div className="grid gap-5 sm:grid-cols-2">
            <NameFields name={name} row={row} state={state} placeholder="Emeka Okafor" />
            <TextField
              label="Relationship"
              name={name("relationship")}
              placeholder="Spouse"
              defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
              errors={state.fieldErrors?.[name("relationship")]}
            />
            <TextField
              label="Address"
              name={name("address")}
              required
              placeholder="12 Bourdillon Road, Ikoyi, Lagos"
              defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
              errors={state.fieldErrors?.[name("address")]}
              className="sm:col-span-2"
            />
            {/*
              Required, both. An executor is somebody your family has to reach
              in the days after a death, usually before anybody has found the
              paperwork.
            */}
            <TextField
              label="Email"
              name={name("email")}
              type="email"
              required
              placeholder="emeka@example.com"
              defaultValue={fieldValue(state, name("email"), row?.email ?? "")}
              errors={state.fieldErrors?.[name("email")]}
            />
            <TextField
              label="Phone"
              name={name("phone")}
              type="tel"
              required
              placeholder="08111115547"
              defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
              errors={state.fieldErrors?.[name("phone")]}
            />
          </div>
        );
      }}
    />
  );
}

function BeneficiariesFields({ will, state }: FieldsProps) {
  /*
    Guardians appointed before they were tied to a beneficiary. Saving this
    page replaces every guardian with the ones entered beside a beneficiary, so
    the client is told plainly rather than finding one gone.
  */
  const unattached = will.guardians.filter((g) => !g.beneficiary_id);

  return (
    <>
      {unattached.length > 0 && (
        <p className="border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-relaxed text-navy">
          Guardians are now appointed beside the beneficiary they look after.
          You previously appointed{" "}
          {unattached.map((g) => g.full_name).join(" and ")}. Tick{" "}
          <strong>under 18</strong> on the beneficiary each is for and enter
          them there — saving this page otherwise removes them.
        </p>
      )}

      <RepeatableList
        legend="Beneficiary"
        prefix="beneficiaries"
        addLabel="Add another beneficiary"
        min={1}
        max={24}
        initialCount={will.beneficiaries.length || 1}
        renderRow={({ name, source }) => {
          const row = source === null ? undefined : will.beneficiaries[source];

          return (
            <BeneficiaryRow
              name={name}
              row={row}
              guardian={row ? will.guardians.find((g) => g.beneficiary_id === row.id) : undefined}
              state={state}
            />
          );
        }}
      />
    </>
  );
}

/**
 * One beneficiary — who they are, and a guardian if they are under eighteen.
 *
 * Only who they are. Their share of the residue is asked on the next page,
 * after the specific gifts.
 */
function BeneficiaryRow({
  name,
  row,
  guardian,
  state,
}: {
  name: (field: string) => string;
  row?: WillPerson;
  guardian?: WillPerson;
  state: FormState;
}) {
  /*
    The answer is held in state because the guardian's fields appear and
    disappear with it — fields rendered while not wanted would post an
    appointment the client has said does not apply.

    The checkbox itself is uncontrolled, defaulting to the last submission.
    React resets a form once its action settles, and a *controlled* checkbox
    does not survive that: on every refusal the box unticked itself while the
    guardian's fields stayed open, and the next press posted the beneficiary as
    an adult.
  */
  const ticked = fieldChecked(state, name("isMinor"), row?.is_minor ?? false);
  const [minor, setMinor] = useState(ticked);

  const guardianName = (field: string) => name(`guardian.${field}`);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/*
        The row being edited. Beneficiaries are updated in place rather than
        re-created, because their shares and guardians point at them.
      */}
      {row?.id && <input type="hidden" name={name("id")} value={row.id} />}

      <NameFields name={name} row={row} state={state} placeholder="Zara Okafor" />
      <TextField
        label="Relationship"
        name={name("relationship")}
        required
        placeholder="Daughter"
        defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
        errors={state.fieldErrors?.[name("relationship")]}
      />
      <TextField
        label="Phone"
        name={name("phone")}
        type="tel"
        hint="Optional"
        defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
        errors={state.fieldErrors?.[name("phone")]}
      />
      <TextField
        label="Address"
        name={name("address")}
        required
        defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
        errors={state.fieldErrors?.[name("address")]}
        className="sm:col-span-2"
      />

      <label className="flex items-start gap-3 text-sm leading-relaxed text-navy sm:col-span-2">
        <input
          type="checkbox"
          name={name("isMinor")}
          defaultChecked={ticked}
          onChange={(event) => setMinor(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-navy"
        />
        <span>
          This beneficiary is <strong>under 18</strong> and needs a guardian.
        </span>
      </label>

      {minor && (
        <div className="space-y-5 border-l-2 border-gold/50 pl-5 sm:col-span-2">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Their guardian
          </p>

          {state.fieldErrors?.[name("guardian")]?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors[name("guardian")][0]}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <NameFields name={guardianName} row={guardian} state={state} placeholder="Chidi Nwosu" />
            <TextField
              label="Relationship to the child"
              name={guardianName("relationship")}
              hint="Optional"
              placeholder="Uncle"
              defaultValue={fieldValue(state, guardianName("relationship"), guardian?.relationship ?? "")}
              errors={state.fieldErrors?.[guardianName("relationship")]}
            />
            <TextField
              label="Phone"
              name={guardianName("phone")}
              type="tel"
              hint="Optional"
              defaultValue={fieldValue(state, guardianName("phone"), guardian?.phone ?? "")}
              errors={state.fieldErrors?.[guardianName("phone")]}
            />
            <TextField
              label="Address"
              name={guardianName("address")}
              required
              defaultValue={fieldValue(state, guardianName("address"), guardian?.address ?? "")}
              errors={state.fieldErrors?.[guardianName("address")]}
              className="sm:col-span-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Who holds the estate in trust, and on what terms.
 *
 * An executor winds the estate up and hands it over; a trustee keeps holding
 * it, which is what a young beneficiary or a share paid out over time
 * requires. Most Wills give both roles to the same people, so that is the
 * default — and naming others clears it, because a Will naming two sets of
 * trustees is a Will nobody can act on.
 */
function TrusteesFields({ will, state }: FieldsProps) {
  // Unanswered is null, and the default offered is that the executors act.
  const acting = fieldChecked(state, "executorsAreTrustees", will.executors_are_trustees ?? true);
  const [executorsActing, setExecutorsActing] = useState(acting);

  return (
    <>
      <div className="border border-border bg-background p-6">
        {/*
          Not `CheckboxField`, because the trustee list below appears and
          disappears with it — a list rendered while it is not wanted posts
          names the client has said should not be there. Uncontrolled all the
          same, for the reason given on the under-18 box: a controlled checkbox
          is unticked by the reset that follows a refused save.
        */}
        <label className="flex items-start gap-3 text-sm text-navy">
          <input
            type="checkbox"
            name="executorsAreTrustees"
            defaultChecked={acting}
            onChange={(event) => setExecutorsActing(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
          />
          <span>My executors should also act as my trustees.</span>
        </label>
      </div>

      {/*
        Only asked for when the executors are not acting. Two, for the same
        reason there are two executors: a trust with one trustee fails the
        moment that person cannot act.
      */}
      {!executorsActing && (
        <RepeatableList
          legend="Trustee"
          prefix="trustees"
          addLabel="Add another trustee"
          min={2}
          max={6}
          initialCount={Math.max(will.trustees?.length ?? 0, 2)}
          renderRow={({ name, source }) => {
            const row = source === null ? undefined : will.trustees?.[source];

            return (
              <div className="grid gap-5 sm:grid-cols-2">
                <NameFields name={name} row={row} state={state} placeholder="Amaka Nwosu" />
                <TextField
                  label="Relationship"
                  name={name("relationship")}
                  placeholder="Sister"
                  defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
                  errors={state.fieldErrors?.[name("relationship")]}
                />
                <TextField
                  label="Address"
                  name={name("address")}
                  required
                  placeholder="9 Bourdillon Road, Ikoyi, Lagos"
                  defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                  errors={state.fieldErrors?.[name("address")]}
                  className="sm:col-span-2"
                />
              </div>
            );
          }}
        />
      )}

      {/*
        Without this direction a guardian looking after young children has to
        ask the executors for money as they need it — which is exactly the
        arrangement that goes wrong when the two do not get on.
      */}
      <div className="border border-border bg-background p-6">
        <CheckboxField
          name="trustBankAccount"
          defaultChecked={fieldChecked(state, "trustBankAccount", will.trust_bank_account ?? false)}
        >
          Direct my executors to open a trust bank account, from which any
          guardian is provided with what my children need.
        </CheckboxField>
      </div>

      <SelectField
        label="How often should beneficiaries be paid?"
        name="distributionFrequency"
        hint="Against the shares you set. Optional."
        defaultValue={fieldValue(state, "distributionFrequency", will.distribution_frequency ?? "")}
        errors={state.fieldErrors?.distributionFrequency}
        options={[
          { value: "", label: "No fixed schedule" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "half_yearly", label: "Half-yearly" },
          { value: "yearly", label: "Yearly" },
        ]}
      />
    </>
  );
}

/**
 * Everything the testator owns, listed before any of it is given away.
 *
 * An estate nobody has enumerated is an estate the executor has to go looking
 * for.
 */
function AssetsFields({ will, state }: FieldsProps) {
  return (
    <>
      <RepeatableList
        legend="Asset"
        prefix="assets"
        addLabel="Add another asset"
        emptyLabel="Nothing listed yet. Add what you own — land, buildings, vehicles, accounts, jewellery, personal effects."
        min={0}
        max={100}
        initialCount={will.assets.length || 1}
        renderRow={({ name, source }) => {
          const row = source === null ? undefined : will.assets[source];

          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Kind"
                name={name("type")}
                required
                defaultValue={fieldValue(state, name("type"), row?.type ?? "real_estate")}
                options={ASSET_TYPES}
                errors={state.fieldErrors?.[name("type")]}
              />
              <TextField
                label="Description"
                name={name("description")}
                required
                placeholder="Three-bedroom bungalow at 12 Awolowo Road, Ikoyi"
                defaultValue={fieldValue(state, name("description"), row?.description ?? "")}
                errors={state.fieldErrors?.[name("description")]}
              />
              <TextField
                label="Where it is held"
                name={name("institution")}
                hint="Optional — bank, registrar, agency"
                defaultValue={fieldValue(state, name("institution"), row?.institution ?? "")}
                errors={state.fieldErrors?.[name("institution")]}
              />
              <TextField
                label="Reference"
                name={name("identifier")}
                hint="Optional — account, plate or title number"
                defaultValue={fieldValue(state, name("identifier"), row?.identifier ?? "")}
                errors={state.fieldErrors?.[name("identifier")]}
              />
            </div>
          );
        }}
      />

      {/*
        Rare and legitimate — somebody whose whole estate is a residue. It
        exists so the section can be finished honestly without inventing an
        asset, and it is ignored the moment one is listed.
      */}
      <div className="border border-border bg-background p-6">
        <CheckboxField
          name="assetsDeclaredNone"
          defaultChecked={fieldChecked(state, "assetsDeclaredNone", will.assets_declared_none ?? false)}
        >
          I have nothing to list separately.
        </CheckboxField>
      </div>
    </>
  );
}

/* ================================ Step 3 ================================= */

export function WishesStep({ will, backHref }: StepProps) {
  const [state, action] = useFormAction(saveWishesAction, { refresh: false });
  const e = state.fieldErrors;

  return (
    <StepForm will={will} state={state} action={action} backHref={backHref}>
      <Section slug="bequests" errors={e?.bequests}>
        <BequestsFields will={will} state={state} />
      </Section>

      <Section slug="residue" errors={e?.shares}>
        <ResidueFields will={will} state={state} />
      </Section>

      <Section slug="funeral">
        <FuneralFields will={will} state={state} />
      </Section>
    </StepForm>
  );
}

function BequestsFields({ will, state }: FieldsProps) {
  return (
    <>
      <RepeatableList
        legend="Gift"
        prefix="bequests"
        addLabel="Add a specific gift"
        emptyLabel="No specific gifts listed yet. Add one, or choose below to leave everything to your trustees."
        min={0}
        max={50}
        initialCount={will.bequests.length}
        renderRow={({ name, source }) => {
          const row = source === null ? undefined : will.bequests[source];

          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Item description"
                name={name("itemDescription")}
                required
                placeholder="My father's gold wristwatch"
                defaultValue={fieldValue(state, name("itemDescription"), row?.item_description ?? "")}
                errors={state.fieldErrors?.[name("itemDescription")]}
                className="sm:col-span-2"
              />
              <TextField
                label="Recipient"
                name={name("recipientName")}
                required
                placeholder="Kene Okafor"
                defaultValue={fieldValue(state, name("recipientName"), row?.recipient_name ?? "")}
                errors={state.fieldErrors?.[name("recipientName")]}
              />
              <TextField
                label="Relationship"
                name={name("recipientRelationship")}
                required
                placeholder="Son"
                defaultValue={fieldValue(state, name("recipientRelationship"), row?.recipient_relationship ?? "")}
                errors={state.fieldErrors?.[name("recipientRelationship")]}
              />
              <TextField
                label="Notes"
                name={name("notes")}
                hint="Optional"
                defaultValue={fieldValue(state, name("notes"), row?.notes ?? "")}
                errors={state.fieldErrors?.[name("notes")]}
                className="sm:col-span-2"
              />
            </div>
          );
        }}
      />

      {/*
        The other answer, not the absence of one.

        Distributing the estate is the point of a Will, so this section cannot
        be clicked past — but not every testator wants to say who gets which
        item. The alternative is a real instruction: the trustees hold
        everything and manage it for the beneficiaries on the shares set just
        below. Ticking this while a gift is listed is contradictory, and the
        server clears it rather than storing both.
      */}
      <div className="border border-border bg-background p-6">
        <CheckboxField
          name="estateInTrust"
          defaultChecked={fieldChecked(state, "estateInTrust", will.estate_in_trust ?? false)}
        >
          I would rather not name gifts individually — leave my whole estate,
          including everything listed as an asset, to my trustees to hold and
          manage for my beneficiaries on the shares I set below.
        </CheckboxField>
      </div>
    </>
  );
}

/** Two decimal places at most, without trailing zeros. */
function formatPercent(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * The residuary estate: how whatever the gifts leave is shared.
 *
 * Asked here, after the specific gifts, rather than beside each beneficiary —
 * the residue is what those gifts leave, so it is divided once they are known.
 * The people come from the previous page; this only asks for a share each.
 */
function ResidueFields({ will, state }: FieldsProps) {
  const beneficiaries = will.beneficiaries;

  /*
    Controlled, so the running total below moves as the client types. A total
    that only appears as a refusal after pressing Save is arithmetic done for
    them the slow way.
  */
  const [shares, setShares] = useState<string[]>(() =>
    beneficiaries.map((b, index) =>
      fieldValue(
        state,
        `shares.${index}.sharePercent`,
        b.share_percent === null || b.share_percent === undefined
          ? ""
          : String(Number(b.share_percent)),
      ),
    ),
  );

  if (beneficiaries.length === 0) {
    return (
      <p className="border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
        You have not named any beneficiaries yet.{" "}
        <Link
          href={`/dashboard/wills/${will.id}/edit?step=${stepForSection("beneficiaries").step}`}
          className="text-navy underline decoration-gold underline-offset-4"
        >
          Name them first
        </Link>
        , then share out the residue here.
      </p>
    );
  }

  // Contingent beneficiaries inherit only if a primary predeceases, so they
  // are not part of the 100% — the same rule the server applies.
  const primary = beneficiaries
    .map((b, index) => ({ b, index }))
    .filter(({ b }) => !b.is_contingent);

  const total =
    primary.reduce(
      (sum, { index }) => sum + Math.round((Number(shares[index]) || 0) * 100),
      0,
    ) / 100;

  /** Equal shares in basis points, with the odd hundredths to the first. */
  const divideEqually = () => {
    const each = Math.floor(10_000 / primary.length);
    const remainder = 10_000 - each * primary.length;

    setShares((current) =>
      current.map((value, index) => {
        const position = primary.findIndex((p) => p.index === index);

        if (position === -1) return value;

        return formatPercent((each + (position === 0 ? remainder : 0)) / 100);
      }),
    );
  };

  return (
    <>
      <div className="border border-border bg-background">
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <span className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
            Beneficiary
          </span>
          {primary.length > 1 && (
            <button
              type="button"
              onClick={divideEqually}
              className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-navy"
            >
              Divide equally
            </button>
          )}
        </div>

        {beneficiaries.map((b, index) => {
          const errors = state.fieldErrors?.[`shares.${index}.sharePercent`];

          return (
            <div
              key={b.id}
              className="flex items-center justify-between gap-4 border-t border-border px-5 py-4"
            >
              <input type="hidden" name={`shares.${index}.beneficiaryId`} value={b.id} />

              <div className="min-w-0">
                <p className="truncate font-serif text-base text-navy">{b.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {[b.relationship, b.is_minor ? "under 18" : null, b.is_contingent ? "contingent" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {errors?.[0] && <p className="mt-1 text-xs text-destructive">{errors[0]}</p>}
              </div>

              <label className="flex shrink-0 items-baseline gap-1.5">
                <span className="sr-only">Share of the residue for {b.full_name}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  name={`shares.${index}.sharePercent`}
                  value={shares[index] ?? ""}
                  onChange={(event) =>
                    setShares((current) =>
                      current.map((value, i) => (i === index ? event.target.value : value)),
                    )
                  }
                  aria-invalid={Boolean(errors?.length)}
                  className={`w-20 border-0 border-b bg-transparent px-0 py-1.5 text-right font-serif text-lg text-navy focus:outline-none focus:ring-0 ${
                    errors?.length ? "border-destructive" : "border-border focus:border-gold"
                  }`}
                />
                <span className="font-serif text-navy">%</span>
              </label>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-4 border-t border-border bg-surface px-5 py-3 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span
            aria-live="polite"
            className={`font-serif text-lg ${total === 100 ? "text-success" : "text-destructive"}`}
          >
            {formatPercent(total)}%
          </span>
        </div>
      </div>

      {/*
        Where a testator can say, in their own words, how the residue should be
        handled — including leaving it to the executors' judgement. That is a
        real instruction rather than a footnote, so it is not labelled
        "Optional".
      */}
      <TextArea
        label="Directions to your executors about the residue"
        name="residuaryEstate"
        hint="In your own words"
        rows={4}
        placeholder="For example: my executors may divide the residue among my children in such shares as they think fit."
        defaultValue={fieldValue(state, "residuaryEstate", will.residuary_estate ?? "")}
        errors={state.fieldErrors?.residuaryEstate}
      />
    </>
  );
}

function FuneralFields({ will, state }: FieldsProps) {
  const e = state.fieldErrors;

  return (
    <>
      <div className="space-y-3">
        <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
          Preference
        </p>
        <RadioCards
          name="funeralPreference"
          defaultValue={fieldValue(state, "funeralPreference", will.funeral_preference ?? "") || undefined}
          errors={e?.funeralPreference}
          options={[
            { value: "burial", label: "Burial" },
            { value: "cremation", label: "Cremation" },
            { value: "other", label: "Other", description: "Describe below." },
          ]}
        />
      </div>

      <TextArea
        label="Special instructions"
        name="funeralInstructions"
        hint="Optional"
        rows={4}
        placeholder="A simple service in Awka, close family only."
        defaultValue={fieldValue(state, "funeralInstructions", will.funeral_instructions ?? "")}
        errors={e?.funeralInstructions}
      />

      <TextArea
        label="Any other wishes for your executors"
        name="specialInstructions"
        hint="Optional"
        rows={4}
        placeholder="Anything else your executors should know."
        defaultValue={fieldValue(state, "specialInstructions", will.special_instructions ?? "")}
        errors={e?.specialInstructions}
      />
    </>
  );
}

/* ================================ Step 4 ================================= */

export function WitnessesStep({ will, backHref }: StepProps) {
  const [state, action] = useFormAction(saveWitnessesAction, { refresh: false });

  return (
    <StepForm will={will} state={state} action={action} backHref={backHref}>
      <Section slug="witnesses" errors={state.fieldErrors?.witnesses}>
        <RepeatableList
          legend="Witness"
          prefix="witnesses"
          addLabel="Add witness"
          min={2}
          max={2}
          initialCount={2}
          renderRow={({ name, source }) => {
            const row = source === null ? undefined : will.witnesses[source];

            return (
              <div className="grid gap-5 sm:grid-cols-2">
                <NameFields name={name} row={row} state={state} placeholder="Tunde Bello" />
                <TextField
                  label="Occupation"
                  name={name("occupation")}
                  hint="Optional"
                  placeholder="Banker"
                  defaultValue={fieldValue(state, name("occupation"), row?.occupation ?? "")}
                  errors={state.fieldErrors?.[name("occupation")]}
                />
                <TextField
                  label="Address"
                  name={name("address")}
                  required
                  defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                  errors={state.fieldErrors?.[name("address")]}
                  className="sm:col-span-2"
                />
                {/*
                  Required, both. A witness may have to be found years later to
                  confirm the signing — and while witness verification is
                  switched on, their identity check uses this email address.
                */}
                <TextField
                  label="Email"
                  name={name("email")}
                  type="email"
                  required
                  placeholder="tunde@example.com"
                  defaultValue={fieldValue(state, name("email"), row?.email ?? "")}
                  errors={state.fieldErrors?.[name("email")]}
                />
                <TextField
                  label="Phone"
                  name={name("phone")}
                  type="tel"
                  required
                  placeholder="08111115547"
                  defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
                  errors={state.fieldErrors?.[name("phone")]}
                />
              </div>
            );
          }}
        />
      </Section>
    </StepForm>
  );
}

/* ================================ Review ================================= */

export function ReviewStep({
  will,
  backHref,
  children,
}: StepProps & { children: React.ReactNode }) {
  const [state, action] = useFormAction(submitWillAction);

  /*
   * The form itself, so the identity check can submit it.
   *
   * `requestSubmit()` rather than `submit()`: the former runs validation and
   * fires the submit event, which is what a React `action` is listening for.
   * `submit()` bypasses both and the action would never run.
   */
  const formRef = useRef<HTMLFormElement>(null);

  /**
   * An amendment to a Will that has already been produced needs the client to
   * confirm it is them. Null for a first draft, a first submission and every
   * print — the server decides, this does not re-derive it.
   */
  const needsIdentity = will.journey?.update_blocked_by === "liveness_required";

  const [checking, setChecking] = useState(false);

  /*
   * A ref, not state: it is read inside the submit handler in the same tick
   * that `requestSubmit()` is called, and a state update would not have landed.
   */
  const confirmed = useRef(false);

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className="space-y-8"
        noValidate
        /*
          The submit button stays, and it is what opens the check.

          Pressing "Save & continue" *is* the request to submit, so it is also
          the request to confirm. This intercepts that press once, opens the
          check over the whole screen, and then lets the second submit — the
          one the check itself fires — straight through.

          React 19 runs `onSubmit` before the action and honours
          `preventDefault()`, so this cancels the submission rather than racing
          it.
        */
        onSubmit={(event) => {
          if (needsIdentity && !confirmed.current) {
            event.preventDefault();
            setChecking(true);
          }
        }}
      >
        <WillId id={will.id} />
        <StepBanner state={state} />
        <HelpPanel>{sectionBySlug("review").help}</HelpPanel>

        {children}

        <div className="border border-border bg-background p-6">
          <CheckboxField
            name="confirmedAccurate"
            defaultChecked={fieldChecked(state, "confirmedAccurate", will.confirmed_accurate)}
            errors={state.fieldErrors?.confirmedAccurate}
          >
            I confirm that the information recorded in this Will is accurate and
            reflects my wishes.
          </CheckboxField>
        </div>

        {/*
          Amending a Will already produced is what the subscription covers.
          `update_blocked_by` is the server's answer, not a rule re-derived
          here: null for a first draft, a first submission and every print.
        */}
        {will.journey?.update_blocked_by === "subscription_required" && (
          <div className="border border-border bg-muted/30 p-6">
            <p className="font-serif text-lg text-foreground">
              Updating this Will needs an active subscription
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Writing your Will was a one-off purchase. Keeping it current as your
              life changes is what the subscription covers.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-4 inline-block text-sm font-semibold text-foreground underline underline-offset-4"
            >
              See the plans
            </Link>
          </div>
        )}

        {/*
          Not "Submit for review". Review is the *optional* stage, and most
          clients skip it — labelling the only way out of the form as though it
          summoned a solicitor promised something the platform does not do by
          default. What the button actually does is commit the answers and move
          on to payment.

          On an amendment this is also what opens the identity check — see the
          `onSubmit` above. It stays put either way: hiding it left the client
          on a page whose only control had vanished.
        */}
        <WizardFooter backHref={backHref} label="Save & continue" />
      </form>

      {/*
        Outside the form on purpose. Nested, the check's own buttons would fall
        inside the form's submit scope, and a default-typed one would post a
        half-finished amendment.

        The form stays mounted underneath: its fields — the accuracy
        confirmation above all — are what gets posted once the check passes,
        and a form that has been unmounted submits nothing.
      */}
      {checking && (
        <AmendmentIdentityCheck
          onBack={() => setChecking(false)}
          onVerified={() => {
            confirmed.current = true;
            setChecking(false);

            /*
             * Next tick, so the modal is out of the DOM before the form is
             * submitted rather than submitting from underneath one — the
             * order the client sees, and the order they asked for.
             *
             * `requestSubmit()` rather than `submit()`: the former runs
             * validation and fires the submit event, which is what a React
             * action listens for. `submit()` bypasses both and the action
             * would never run.
             */
            window.setTimeout(() => formRef.current?.requestSubmit(), 0);
          }}
        />
      )}
    </>
  );
}
