"use client";

import { useState } from "react";

import { useFormAction } from "@/hooks/use-api-form";
import { type FormState } from "@/lib/actions/state";
import { type ApiWill } from "@/lib/actions/will";
import {
  savePersonalAction,
  saveDeclarationAction,
  saveExecutorsAction,
  saveBeneficiariesAction,
  saveGuardianshipAction,
  saveAssetsAction,
  saveBequestsAction,
  saveFuneralAction,
  saveTrusteesAction,
  saveWitnessesAction,
  submitWillAction,
} from "@/lib/actions/will.client";
import { NIGERIAN_STATES } from "@/lib/will/reference";
import {
  CheckboxField,
  RadioCards,
  SelectField,
  TextArea,
  TextField,
} from "./Fields";
import { RepeatableList } from "./RepeatableList";
import { HelpPanel, StepBanner, WizardFooter } from "./WizardChrome";

type StepProps = { will: ApiWill; help: string; backHref?: string };

const stateOptions = NIGERIAN_STATES.map((s) => ({ value: s, label: s }));

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
      />
      <TextField
        label="Middle name"
        name={name("middleName")}
        placeholder="Optional"
        defaultValue={fieldValue(state, name("middleName"), row?.middle_name ?? "")}
      />
      <TextField
        label="Surname"
        name={name("lastName")}
        required
        placeholder={example.at(-1) ?? ""}
        defaultValue={fieldValue(state, name("lastName"), row?.last_name ?? "")}
      />
    </>
  );
}

/* ------------------------------- Step 1 ---------------------------------- */

export function PersonalStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(savePersonalAction, { refresh: false });
  const e = state.fieldErrors;

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <div className="grid gap-6 sm:grid-cols-2">
        {/*
          Three parts, as on the ID.
          
          The testator's name is the one this platform verifies against a
          government record, so a surname it has to guess at is a surname it
          can guess wrong — and a wrong guess is a failed identity check on a
          perfectly good document.
        */}
        <TextField
          label="First name"
          name="firstName"
          placeholder="Ada"
          hint="As on your ID"
          required
          defaultValue={fieldValue(state, "firstName", will.personal.first_name ?? "")}
          errors={e?.firstName}
        />
        <TextField
          label="Middle name"
          name="middleName"
          placeholder="Optional"
          defaultValue={fieldValue(state, "middleName", will.personal.middle_name ?? "")}
          errors={e?.middleName}
        />
        <TextField
          label="Surname"
          name="lastName"
          placeholder="Okafor"
          hint="As on your ID"
          required
          defaultValue={fieldValue(state, "lastName", will.personal.last_name ?? "")}
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
        <TextField
          label="National Identification Number"
          name="nationalId"
          hint="Optional"
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

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 2 ---------------------------------- */

export function DeclarationStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveDeclarationAction, { refresh: false });
  const e = state.fieldErrors;

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

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

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 3 ---------------------------------- */

export function ExecutorsStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveExecutorsAction, { refresh: false });

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <RepeatableList
        legend="Executor"
        prefix="executors"
        addLabel="Add another executor"
        /*
          Two, not one. A Will with a single executor has a single point of
          failure: if that person dies first, cannot act or declines, the
          estate goes to the court for an administrator nobody chose. The
          server enforces the same minimum.
        */
        min={2}
        max={6}
        initialCount={Math.max(will.executors.length, 2)}
        renderRow={({ index, name }) => {
          const row = will.executors[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <NameFields
                name={name}
                row={row}
                state={state}
                placeholder="Emeka Okafor"
              />
              <TextField
                label="Relationship"
                name={name("relationship")}
                placeholder="Spouse"
                defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
              />
              <TextField
                label="Address"
                name={name("address")}
                required
                placeholder="12 Bourdillon Road, Ikoyi, Lagos"
                defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                className="sm:col-span-2"
              />
              <TextField
                label="Email"
                name={name("email")}
                type="email"
                hint="Optional"
                defaultValue={fieldValue(state, name("email"), row?.email ?? "")}
              />
              <TextField
                label="Phone"
                name={name("phone")}
                hint="Optional"
                placeholder="08111115547"
                defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
              />
            </div>
          );
        }}
      />

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 4 ---------------------------------- */

export function BeneficiariesStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveBeneficiariesAction, { refresh: false });

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <RepeatableList
        legend="Beneficiary"
        prefix="beneficiaries"
        addLabel="Add another beneficiary"
        min={1}
        max={24}
        initialCount={will.beneficiaries.length || 1}
        renderRow={({ index, name }) => {
          const row = will.beneficiaries[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <NameFields
                name={name}
                row={row}
                state={state}
                placeholder="Zara Okafor"
              />
              <TextField
                label="Relationship"
                name={name("relationship")}
                required
                placeholder="Daughter"
                defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
              />
              <TextField
                label="Share of residuary estate (%)"
                name={name("sharePercent")}
                type="number"
                required
                placeholder="50"
                defaultValue={fieldValue(state, name("sharePercent"), row ? String(Number(row.share_percent)) : "")}
              />
              <TextField
                label="Phone"
                name={name("phone")}
                hint="Optional"
                defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
              />
              <TextField
                label="Address"
                name={name("address")}
                required
                defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                className="sm:col-span-2"
              />
            </div>
          );
        }}
      />

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
      />

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 5 ---------------------------------- */

export function GuardianshipStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveGuardianshipAction, { refresh: false });
  const [hasChildren, setHasChildren] = useState(
    will.has_minor_children ?? false,
  );

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <div className="space-y-4">
        <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy">
          Do you have children under eighteen?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "yes", label: "Yes", description: "I will appoint a guardian." },
            {
              value: "no",
              label: "No",
              description: "Skip this section entirely.",
            },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer flex-col gap-1 border border-border p-4 transition-colors hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/5"
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="hasMinorChildren"
                  value={option.value}
                  checked={hasChildren === (option.value === "yes")}
                  onChange={() => setHasChildren(option.value === "yes")}
                  className="h-4 w-4 border-border text-navy focus:ring-gold"
                />
                <span className="font-serif text-base text-navy">
                  {option.label}
                </span>
              </span>
              <span className="pl-7 text-xs text-muted-foreground">
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasChildren && (
        <RepeatableList
          legend="Guardian"
        prefix="guardians"
          addLabel="Add an alternate guardian"
          min={1}
          max={6}
          initialCount={will.guardians.length || 1}
          renderRow={({ index, name }) => {
            const row = will.guardians[index];
            return (
              <div className="grid gap-5 sm:grid-cols-2">
                <NameFields
                  name={name}
                  row={row}
                  state={state}
                  placeholder="Chidi Nwosu"
                />
                <TextField
                  label="Relationship"
                  name={name("relationship")}
                  placeholder="Brother"
                  defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
                />
                <TextField
                  label="Address"
                  name={name("address")}
                  required
                  defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                  className="sm:col-span-2"
                />
                <TextField
                  label="Phone"
                  name={name("phone")}
                  hint="Optional"
                  defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
                />
                <TextField
                  label="Children covered"
                  name={name("childrenCovered")}
                  hint="Optional"
                  placeholder="Zara and Kene"
                  defaultValue={fieldValue(state, name("childrenCovered"), row?.children_covered ?? "")}
                />
                <div className="sm:col-span-2">
                  <CheckboxField
                    name={name("isAlternate")}
                    defaultChecked={fieldChecked(state, name("isAlternate"), row?.is_alternate ?? false)}
                  >
                    This is an <strong>alternate</strong> guardian.
                  </CheckboxField>
                </div>
              </div>
            );
          }}
        />
      )}

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 6 ---------------------------------- */

export function BequestsStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveBequestsAction, { refresh: false });

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <RepeatableList
        legend="Bequest"
        prefix="bequests"
        addLabel="Add a specific gift"
        emptyLabel="No specific gifts listed yet. Add one, or choose below to leave everything to your trustees."
        min={0}
        max={50}
        initialCount={will.bequests.length}
        renderRow={({ index, name }) => {
          const row = will.bequests[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Item description"
                name={name("itemDescription")}
                required
                placeholder="My father's gold wristwatch"
                defaultValue={fieldValue(state, name("itemDescription"), row?.item_description ?? "")}
                className="sm:col-span-2"
              />
              <TextField
                label="Recipient"
                name={name("recipientName")}
                required
                placeholder="Kene Okafor"
                defaultValue={fieldValue(state, name("recipientName"), row?.recipient_name ?? "")}
              />
              <TextField
                label="Relationship"
                name={name("recipientRelationship")}
                placeholder="Son"
                defaultValue={fieldValue(state, name("recipientRelationship"), row?.recipient_relationship ?? "")}
              />
              <TextField
                label="Notes"
                name={name("notes")}
                hint="Optional"
                defaultValue={fieldValue(state, name("notes"), row?.notes ?? "")}
                className="sm:col-span-2"
              />
            </div>
          );
        }}
      />

      {/*
        The other answer, not the absence of one.

        Distributing the estate is the point of a Will, so this step cannot be
        clicked past — but not every testator wants to say who gets which item.
        The alternative is a real instruction: the trustees hold everything and
        manage it for the beneficiaries on the shares already recorded against
        them. Ticking this while a gift is listed is contradictory, and the
        server clears it rather than storing both.
      */}
      <div className="border border-border bg-background p-6">
        <CheckboxField
          name="estateInTrust"
          defaultChecked={fieldChecked(state, "estateInTrust", will.estate_in_trust ?? false)}
        >
          I would rather not name gifts individually — leave my whole estate,
          including everything listed as an asset, to my trustees to hold and
          manage for my beneficiaries on the shares I have set.
        </CheckboxField>
      </div>

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* -------------------------------- Assets --------------------------------- */

/**
 * Everything the testator owns, listed before any of it is given away.
 *
 * Its own step. It used to be a corner of the bequests page, which asked
 * somebody to decide who gets what before they had written down what there is
 * — and an estate nobody has enumerated is an estate the executor has to go
 * looking for.
 */
export function AssetsStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveAssetsAction, { refresh: false });

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <RepeatableList
        legend="Asset"
        prefix="assets"
        addLabel="Add another asset"
        emptyLabel="Nothing listed yet. Add what you own — land, buildings, vehicles, accounts, jewellery, personal effects."
        min={0}
        max={100}
        initialCount={will.assets.length || 1}
        renderRow={({ index, name }) => {
          const row = will.assets[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Kind"
                name={name("type")}
                required
                defaultValue={fieldValue(state, name("type"), row?.type ?? "real_estate")}
                options={ASSET_TYPES}
              />
              <TextField
                label="Description"
                name={name("description")}
                required
                placeholder="Three-bedroom bungalow at 12 Awolowo Road, Ikoyi"
                defaultValue={fieldValue(state, name("description"), row?.description ?? "")}
              />
              <TextField
                label="Where it is held"
                name={name("institution")}
                hint="Optional — bank, registrar, agency"
                defaultValue={fieldValue(state, name("institution"), row?.institution ?? "")}
              />
              <TextField
                label="Reference"
                name={name("identifier")}
                hint="Optional — account, plate or title number"
                defaultValue={fieldValue(state, name("identifier"), row?.identifier ?? "")}
              />
            </div>
          );
        }}
      />

      {/*
        Rare and legitimate — somebody whose whole estate is a residue they
        have already described. It exists so the step can be finished honestly
        without inventing an asset, and it is ignored the moment one is listed.
      */}
      <div className="border border-border bg-background p-6">
        <CheckboxField
          name="assetsDeclaredNone"
          defaultChecked={fieldChecked(state, "assetsDeclaredNone", will.assets_declared_none ?? false)}
        >
          I have nothing to list separately.
        </CheckboxField>
      </div>

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Trustees -------------------------------- */

/**
 * Who holds the estate in trust, and on what terms.
 *
 * An executor winds the estate up and hands it over; a trustee keeps holding
 * it, which is what a young beneficiary or a share paid out over time
 * requires. Most Wills give both roles to the same people, so that is the
 * default — and naming others clears it, because a Will naming two sets of
 * trustees is a Will nobody can act on.
 */
export function TrusteesStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveTrusteesAction, { refresh: false });

  const [executorsActing, setExecutorsActing] = useState(
    will.executors_are_trustees ?? true,
  );

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <div className="border border-border bg-background p-6">
        {/*
          Controlled here rather than by `CheckboxField`, because the trustee
          list below appears and disappears with it — and a list that is
          rendered while it is not wanted posts names the client has said
          should not be there.
        */}
        <label className="flex items-start gap-3 text-sm text-navy">
          <input
            type="checkbox"
            name="executorsAreTrustees"
            checked={executorsActing}
            onChange={(event) => setExecutorsActing(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
          />
          <span>My executors should also act as my trustees.</span>
        </label>
      </div>

      {/*
        Only asked for when the executors are not acting. Two, for the same
        reason there are two executors: a trust with one trustee fails the
        moment that person cannot act, and a trust is held for far longer than
        an estate takes to wind up.
      */}
      {!executorsActing && (
        <RepeatableList
          legend="Trustee"
        prefix="trustees"
          addLabel="Add another trustee"
          min={2}
          max={6}
          initialCount={Math.max(will.trustees?.length ?? 0, 2)}
          renderRow={({ index, name }) => {
            const row = will.trustees?.[index];
            return (
              <div className="grid gap-5 sm:grid-cols-2">
                <NameFields
                  name={name}
                  row={row}
                  state={state}
                  placeholder="Amaka Nwosu"
                />
                <TextField
                  label="Relationship"
                  name={name("relationship")}
                  placeholder="Sister"
                  defaultValue={fieldValue(state, name("relationship"), row?.relationship ?? "")}
                />
                <TextField
                  label="Address"
                  name={name("address")}
                  required
                  placeholder="9 Bourdillon Road, Ikoyi, Lagos"
                  defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
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
        hint="Against the shares you have already set. Optional."
        defaultValue={fieldValue(state, "distributionFrequency", will.distribution_frequency ?? "")}
        options={[
          { value: "", label: "No fixed schedule" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "half_yearly", label: "Half-yearly" },
          { value: "yearly", label: "Yearly" },
        ]}
      />

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 7 ---------------------------------- */

export function FuneralStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveFuneralAction, { refresh: false });
  const e = state.fieldErrors;

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

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

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 8 ---------------------------------- */

export function WitnessesStep({ will, help, backHref }: StepProps) {
  const [state, action] = useFormAction(saveWitnessesAction, { refresh: false });

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

      <RepeatableList
        legend="Witness"
        prefix="witnesses"
        addLabel="Add witness"
        min={2}
        max={2}
        initialCount={2}
        renderRow={({ index, name }) => {
          const row = will.witnesses[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <NameFields
                name={name}
                row={row}
                state={state}
                placeholder="Tunde Bello"
              />
              <TextField
                label="Occupation"
                name={name("occupation")}
                hint="Optional"
                placeholder="Banker"
                defaultValue={fieldValue(state, name("occupation"), row?.occupation ?? "")}
              />
              <TextField
                label="Address"
                name={name("address")}
                required
                defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                className="sm:col-span-2"
              />
              <TextField
                label="Email"
                name={name("email")}
                type="email"
                hint="Optional"
                defaultValue={fieldValue(state, name("email"), row?.email ?? "")}
              />
              <TextField
                label="Phone"
                name={name("phone")}
                hint="Optional"
                defaultValue={fieldValue(state, name("phone"), row?.phone ?? "")}
              />
            </div>
          );
        }}
      />

      <WizardFooter backHref={backHref} />
    </form>
  );
}

/* ------------------------------- Step 9 ---------------------------------- */

export function ReviewStep({
  will,
  help,
  backHref,
  children,
}: StepProps & { children: React.ReactNode }) {
  const [state, action] = useFormAction(submitWillAction);

  return (
    <form action={action} className="space-y-8" noValidate>
      <WillId id={will.id} />
      <StepBanner state={state} />
      <HelpPanel>{help}</HelpPanel>

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
        Not "Submit for review". Review is the *optional* stage, and most
        clients skip it — labelling the only way out of the form as though it
        summoned a solicitor promised something the platform does not do by
        default. What the button actually does is commit the answers and move
        on to payment.
      */}
      <WizardFooter backHref={backHref} label="Save & continue" />
    </form>
  );
}
