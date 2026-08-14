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
  saveBequestsAction,
  saveFuneralAction,
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
        <TextField
          label="Full legal name"
          name="fullLegalName"
          placeholder="Ada Chinelo Okafor"
          hint="As on your ID"
          required
          defaultValue={fieldValue(state, "fullLegalName", will.personal.full_legal_name ?? "")}
          errors={e?.fullLegalName}
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
        addLabel="Add another executor"
        min={1}
        max={6}
        initialCount={will.executors.length || 2}
        renderRow={({ index, name }) => {
          const row = will.executors[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Full name"
                name={name("fullName")}
                required
                placeholder="Emeka Okafor"
                defaultValue={fieldValue(state, name("fullName"), row?.full_name ?? "")}
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
              <div className="sm:col-span-2">
                <CheckboxField
                  name={name("isAlternate")}
                  defaultChecked={fieldChecked(state, name("isAlternate"), row?.is_alternate ?? false)}
                >
                  This is an <strong>alternate</strong> executor, who acts only
                  if a primary executor cannot.
                </CheckboxField>
              </div>
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
        addLabel="Add another beneficiary"
        min={1}
        max={24}
        initialCount={will.beneficiaries.length || 1}
        renderRow={({ index, name }) => {
          const row = will.beneficiaries[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Full name"
                name={name("fullName")}
                required
                placeholder="Zara Okafor"
                defaultValue={fieldValue(state, name("fullName"), row?.full_name ?? "")}
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
                hint="Optional"
                defaultValue={fieldValue(state, name("address"), row?.address ?? "")}
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <CheckboxField
                  name={name("isContingent")}
                  defaultChecked={fieldChecked(state, name("isContingent"), row?.is_contingent ?? false)}
                >
                  This is a <strong>contingent</strong> beneficiary, who inherits
                  only if a primary beneficiary predeceases me. Contingent shares
                  are excluded from the 100% total.
                </CheckboxField>
              </div>
            </div>
          );
        }}
      />

      <TextArea
        label="Further directions as to residue"
        name="residuaryEstate"
        hint="Optional"
        rows={3}
        placeholder="Any additional instructions about how the residue should be divided."
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
          addLabel="Add an alternate guardian"
          min={1}
          max={6}
          initialCount={will.guardians.length || 1}
          renderRow={({ index, name }) => {
            const row = will.guardians[index];
            return (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Full name"
                  name={name("fullName")}
                  required
                  placeholder="Chidi Nwosu"
                  defaultValue={fieldValue(state, name("fullName"), row?.full_name ?? "")}
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
        addLabel="Add a specific gift"
        emptyLabel="No specific gifts recorded. This section is optional — everything not listed here passes with the residuary estate."
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
                hint="Optional"
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
        addLabel="Add witness"
        min={2}
        max={2}
        initialCount={2}
        renderRow={({ index, name }) => {
          const row = will.witnesses[index];
          return (
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Full name"
                name={name("fullName")}
                required
                placeholder="Tunde Bello"
                defaultValue={fieldValue(state, name("fullName"), row?.full_name ?? "")}
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
