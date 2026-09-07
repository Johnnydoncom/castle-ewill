"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  fetchWitnessIdentitiesAction,
  submitWitnessIdentitiesAction,
} from "@/lib/actions/verification.client";
import { useFormAction } from "@/hooks/use-api-form";
import type {
  SuggestedWitness,
  WitnessIdentityRecord,
  WitnessIdType,
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
 * What a number of each type should look like, in words.
 *
 * Derived from Smile ID's own regex rather than written out beside it, so a
 * hint can never say one thing while the pattern enforces another.
 */
function hintFor(regex: string): string {
  const digits = /^\^\[0-9\]\{(\d+)\}\$$/.exec(regex);

  if (digits) return `${digits[1]} digits`;

  const range = /\{(\d+),(\d+)\}/.exec(regex);

  if (range) return `${range[1]}–${range[2]} letters or digits`;

  return "as printed on the ID";
}

/** Whether the field should bring up a number pad. */
function isNumeric(regex: string): boolean {
  return /^\^\[0-9\]/.test(regex);
}

/**
 * A witness the authority has already confirmed.
 *
 * Shown, not editable. The check is a paid lookup against a third party that
 * can be down this hour and up the next, so re-running one that has already
 * passed spends a request to be told what we know — and can take a confirmed
 * witness back to unverified for a reason that has nothing to do with them.
 *
 * Nothing here is a form field, so nothing here is submitted again either.
 */
function ConfirmedWitness({
  index,
  record,
  idTypes,
}: {
  index: number;
  record: WitnessIdentityRecord;
  idTypes: WitnessIdType[];
}) {
  const label =
    idTypes.find((type) => type.type === record.id_type)?.label ??
    record.id_type ??
    "ID";

  return (
    <fieldset className="border border-success/40 bg-success/5 p-5">
      <legend className="flex items-center gap-3 px-2 font-serif text-[10px] uppercase tracking-[0.28em] text-gold">
        Witness {index + 1}
        <StatusChip status={record.status} />
      </legend>

      <p className="font-serif text-lg text-navy">{record.full_name}</p>

      <p className="mt-1 text-sm text-muted-foreground">
        {label} · {record.id_number}
      </p>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Confirmed by the issuing authority. There is nothing more to do for this
        witness — we will not check them again.
      </p>
    </fieldset>
  );
}

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
  idTypes,
}: {
  index: number;
  record?: WitnessIdentityRecord;
  /** As the Will already names this witness. */
  suggested?: SuggestedWitness;
  values?: Record<string, string>;
  /** What may be asked today. Server-supplied — see `witnessIdTypes()`. */
  idTypes: WitnessIdType[];
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
    values?.[field("id_type")] ??
      record?.id_type ??
      idTypes[0]?.type ??
      "NIN_V2",
  );

  /*
   * The stored type may no longer be on offer — an authority went down, or a
   * `1016` took it off the list — in which case the select falls back to the
   * first thing that is, rather than to a blank option that silently submits
   * nothing.
   */
  const chosen =
    idTypes.find((type) => type.type === idType) ?? idTypes[0] ?? null;

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

      {/*
        A check that produced no verdict, and why. Two different situations
        wearing one message is what sent people round a retry loop: an
        authority that did not answer is worth asking again, an ID type this
        account cannot ask about is not.
      */}
      {record?.status === "pending" && record.note && (
        <p className="mb-4 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-relaxed text-navy">
          {record.note}
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
            Email address
          </span>
          <input
            name={field("email")}
            type="email"
            defaultValue={value("email") || record?.email || suggested?.email || ""}
            required
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Which ID
          </span>
          <select
            name={field("id_type")}
            value={chosen?.type ?? idType}
            onChange={(event) => setIdType(event.target.value)}
            required
            className="mt-1.5 w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          >
            {idTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            ID number{chosen ? ` · ${hintFor(chosen.regex)}` : ""}
          </span>
          <input
            name={field("id_number")}
            defaultValue={value("id_number")}
            required
            inputMode={chosen && isNumeric(chosen.regex) ? "numeric" : "text"}
            /*
              Their regex, applied by the browser. The server applies the same
              one — this is the courtesy, that is the guarantee.
            */
            pattern={chosen?.regex}
            title={chosen ? `Expected: ${hintFor(chosen.regex)}` : undefined}
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
function Submit({
  hasRecords,
  remaining,
}: {
  hasRecords: boolean;
  /** How many witnesses this submission covers. */
  remaining: number;
}) {
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
          : remaining === 1
            ? "Check this witness"
            : "Check both witnesses"}
    </button>
  );
}

export function WitnessVerification({
  records = [],
  suggested = [],
  idTypes = [],
}: {
  records?: WitnessIdentityRecord[];
  /** The witnesses named in the Will, used to pre-fill the form. */
  suggested?: SuggestedWitness[];
  /**
   * The IDs Smile ID can actually be asked about today.
   *
   * Read on the server and passed in rather than compiled into this file: a
   * type this account has not enabled, or an authority that is offline, would
   * otherwise be offered and then fail — which is how a client was told to
   * "try again in a moment" about something that could never succeed.
   */
  idTypes?: WitnessIdType[];
}) {
  const [state, action] = useFormAction(submitWitnessIdentitiesAction);

  /*
   * The verdict arrives out of band, so the screen has to ask for it.
   *
   * Enhanced KYC answers `202` and sends the outcome to our webhook seconds
   * later. Without asking, the client sits on "being checked" until they think
   * to reload.
   *
   * **Asked for as data, never as a page.** `router.refresh()` was tried and
   * was worse than the problem: it re-runs the route on the server and
   * re-renders the form underneath whoever is filling it in, so every four
   * seconds a half-typed witness vanished. These records live in state and
   * only the state is replaced.
   */
  const [live, setLive] = useState<WitnessIdentityRecord[] | null>(null);

  const shown = live ?? records;
  const awaitingVerdict = shown.some((r) => r.status === "pending");

  useEffect(() => {
    if (!awaitingVerdict) return;

    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;

      const fresh = await fetchWitnessIdentitiesAction();

      if (cancelled) return;

      // Null means the read failed, which is not news about the witnesses.
      if (fresh) setLive(fresh);

      /*
       * Bounded, because a page polling forever is a page hammering the API
       * from a tab somebody abandoned. Two minutes is far longer than an
       * answer takes and short enough to stop mattering.
       */
      if (Date.now() - startedAt < 120_000) {
        timer = window.setTimeout(() => void tick(), 4000);
      }
    };

    let timer = window.setTimeout(() => void tick(), 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [awaitingVerdict]);

  /*
   * Two lists, because they are two different things on this screen: an answer
   * we already have, and a question still outstanding. Only the second is a
   * form, and only the second is submitted.
   */
  const confirmed = shown.filter((r) => r.status === "verified");
  const outstanding = shown.filter((r) => r.status !== "verified");

  const isComplete = confirmed.length >= 2;

  // What is left to ask about. A slot with no record yet is a witness whose
  // details have never been entered.
  const slots = Math.max(0, 2 - confirmed.length);

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-navy">Your two witnesses</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We ask the authority that issued each witness&apos;s ID whether the
            number belongs to them. Both must be confirmed before your Will can
            be printed. Ask each witness first — it is their identity, not
            yours — and enter their name exactly as it appears on the ID.
            Answers usually come back within a few seconds.
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
          {confirmed.length} of 2 verified
        </span>
      </div>

      <div className="mt-6 space-y-5">
        {confirmed.map((record, index) => (
          <ConfirmedWitness
            key={record.id}
            index={index}
            record={record}
            idTypes={idTypes}
          />
        ))}
      </div>

      {isComplete ? (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Both witnesses are confirmed. Nothing further is needed here.
        </p>
      ) : (
        <form action={action} className="mt-5 space-y-5">
          {/*
            Whoever is left, together — see the note at the top of this file.
            The indices are the form's, not the Will's: the request carries only
            the witnesses still to be checked, so a confirmed one is never sent
            back to the authority.
          */}
          {Array.from({ length: slots }, (_, index) => (
            <WitnessFields
              key={index}
              index={index}
              record={outstanding[index]}
              suggested={suggested[confirmed.length + index]}
              values={state.values}
              idTypes={idTypes}
            />
          ))}

        <div className="flex flex-wrap items-center gap-4">
          <Submit
            hasRecords={outstanding.length > 0}
            remaining={slots}
          />

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
      )}
    </section>
  );
}
