"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { submitWitnessIdentitiesAction } from "@/lib/actions/verification.client";
import { useFormAction } from "@/hooks/use-api-form";
import type {
  SuggestedWitness,
  WitnessIdentityRecord,
} from "@/lib/actions/verification";

/**
 * Both witnesses, on one form.
 *
 * ## Why there is no upload here
 *
 * A witness used to photograph their ID and we held the image. They are now
 * checked against the issuing authority by ID number — Smile ID's Basic KYC —
 * which asks the question the attestation actually turns on: does this number
 * belong to this name? Somebody looking at a photograph can only tell that a
 * document exists.
 *
 * It also means no third party's identity document is uploaded, transmitted or
 * stored anywhere. The two people who agreed to witness a signature never
 * agreed to become our clients.
 *
 * ## Why both at once
 *
 * The attestation has two signatories, and the client is sitting with both IDs
 * in front of them. One form and then another turns a single sitting into two,
 * and is how the second witness never gets entered at all.
 */
/**
 * What Nigeria's Basic KYC can actually be asked about, with the shape each
 * number must be in.
 *
 * Narrower than it looks. Basic KYC asks an authority about a *number*, so
 * there is no passport or driving licence here — those are document products.
 * Nor is there a plain "NIN": it comes as the card number or the slip. We
 * offered NIN, a licence and a passport, and that is why witness checks came
 * back with nothing verified.
 *
 * The patterns are Smile ID's own, from their ID-number regex table. Checked
 * here so a client gets "that is not eleven digits" while they are looking at
 * the field, rather than a vendor error a minute later — the server checks the
 * same thing, and that check is the guarantee.
 */
const ID_TYPES = [
  {
    value: "NIN_V2",
    label: "National Identity Number (NIN)",
    pattern: /^[0-9]{11}$/,
    hint: "11 digits",
  },
  {
    value: "NIN_SLIP",
    label: "NIN slip",
    pattern: /^[0-9]{11}$/,
    hint: "11 digits",
  },
  {
    value: "BVN",
    label: "Bank Verification Number (BVN)",
    pattern: /^[0-9]{11}$/,
    hint: "11 digits",
  },
  {
    value: "VOTER_ID",
    label: "Voter card",
    pattern: /^[a-zA-Z0-9 ]{9,29}$/,
    hint: "9–29 letters or digits",
  },
  {
    value: "PHONE_NUMBER",
    label: "Phone number",
    pattern: /^[0-9]{11}$/,
    hint: "11 digits",
  },
] as const;

function StatusChip({ status }: { status: WitnessIdentityRecord["status"] }) {
  const [Icon, label, tone] =
    status === "verified"
      ? [CheckCircle2, "Verified", "border-success/50 text-success"]
      : status === "rejected"
        ? [XCircle, "Not verified", "border-destructive/50 text-destructive"]
        : [Clock, "Being checked", "border-gold/60 text-gold"];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${tone}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function WitnessFields({
  index,
  record,
  suggested,
  values,
}: {
  index: number;
  record?: WitnessIdentityRecord;
  /** As the Will already names this witness. */
  suggested?: SuggestedWitness;
  values?: Record<string, string>;
}) {
  const field = (name: string) => `witnesses.${index}.${name}`;
  const value = (name: string) => values?.[field(name)] ?? "";

  /*
   * What was last submitted, then what is already stored, then what the Will
   * says, then nothing.
   *
   * The stored record comes before the Will's suggestion because it is what
   * this person actually typed — a page reload used to fall through to the
   * suggestion, or to nothing, and the form came back empty after a
   * submission that had plainly worked.
   */
  const [idType, setIdType] = useState<string>(
    values?.[field("id_type")] ?? record?.id_type ?? "NIN_V2",
  );

  const chosen = ID_TYPES.find((type) => type.value === idType);

  const prefill = (part: "first" | "middle" | "last") =>
    part === "first"
      ? (record?.first_name ?? suggested?.first_name ?? "")
      : part === "middle"
        ? (record?.middle_name ?? suggested?.middle_name ?? "")
        : (record?.last_name ?? suggested?.last_name ?? "");

  return (
    <fieldset className="border border-border bg-surface p-5">
      <legend className="flex items-center gap-3 px-2 font-serif text-[10px] uppercase tracking-[0.28em] text-gold">
        Witness {index + 1}
        {record && <StatusChip status={record.status} />}
      </legend>

      {record?.status === "rejected" && record.rejection_reason && (
        <p className="mb-4 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-navy">
          {record.rejection_reason}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            First name
          </span>
          <input
            name={field("first_name")}
            defaultValue={value("first_name") || prefill("first")}
            required
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Surname
          </span>
          <input
            name={field("last_name")}
            defaultValue={value("last_name") || prefill("last")}
            required
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Middle name
          </span>
          <input
            name={field("middle_name")}
            defaultValue={value("middle_name") || prefill("middle")}
            placeholder="Optional"
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Which ID
          </span>
          <select
            name={field("id_type")}
            value={idType}
            onChange={(event) => setIdType(event.target.value)}
            required
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          >
            {ID_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            ID number{chosen ? ` · ${chosen.hint}` : ""}
          </span>
          <input
            name={field("id_number")}
            defaultValue={value("id_number")}
            required
            inputMode={chosen?.value === "VOTER_ID" ? "text" : "numeric"}
            /*
              Their regex, applied by the browser. The server applies the same
              one — this is the courtesy, that is the guarantee.
            */
            pattern={chosen?.pattern.source}
            title={chosen ? `Expected: ${chosen.hint}` : undefined}
            /*
              Shown as a placeholder, never as a value: what comes back from
              the API is masked, and putting the mask into an input the client
              might submit unchanged would send us bullet characters.
            */
            placeholder={record?.id_number ?? ""}
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          />
        </label>
      </div>
    </fieldset>
  );
}

/**
 * The submit button, which knows when it is working.
 *
 * This check is a round trip to an ID authority, and it is not instant. With
 * no sign that anything was happening, the honest reading of the screen was
 * "nothing happened" — so people click again, and a second click resubmits
 * both witnesses.
 *
 * `useFormStatus` rather than the action's own state: it reports the pending
 * form from inside it, which is exactly the window the client is staring at.
 */
function Submit({ hasRecords }: { hasRecords: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 items-center justify-center gap-2 rounded-full bg-navy px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending
        ? "Checking with the ID authority…"
        : hasRecords
          ? "Check again"
          : "Check both witnesses"}
    </button>
  );
}

export function WitnessVerification({
  records = [],
  suggested = [],
}: {
  records?: WitnessIdentityRecord[];
  /** The witnesses named in the Will, used to pre-fill the form. */
  suggested?: SuggestedWitness[];
}) {
  const [state, action] = useFormAction(submitWitnessIdentitiesAction);

  const verified = records.filter((r) => r.status === "verified").length;
  const isComplete = verified >= 2;

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-navy">Your two witnesses</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We check each witness against the authority that issued their ID.
            Both must be confirmed before your Will can be printed. Ask each
            witness first — it is their identity, not yours — and enter their
            name exactly as it appears on the ID.
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Nothing is uploaded, and we keep no copy of anyone&apos;s document.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${isComplete
            ? "border-success/50 text-success"
            : "border-gold/60 text-gold"
            }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {verified} of 2 verified
        </span>
      </div>

      <form action={action} className="mt-6 space-y-5">
        {/* Both, together — see the note at the top of this file. */}
        <WitnessFields
          index={0}
          record={records[0]}
          suggested={suggested[0]}
          values={state.values}
        />
        <WitnessFields
          index={1}
          record={records[1]}
          suggested={suggested[1]}
          values={state.values}
        />

        <div className="flex flex-wrap items-center gap-4">
          <Submit hasRecords={records.length > 0} />

          {state.status !== "idle" && state.message && (
            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${state.status === "error" ? "text-destructive" : "text-success"
                }`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
