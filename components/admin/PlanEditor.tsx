"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Pencil, Plus } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import {
  savePlanAction,
  setPlanAvailabilityAction,
} from "@/lib/actions/review";
import type { Plan, PlanKind } from "@/lib/pricing/types";

/**
 * Pricing management.
 *
 * Prices are entered in **naira**, converted to kobo once on the server. The
 * three kinds are not cosmetic: `will` is a tier a client chooses, `lodging`
 * is the compulsory registry fee added to any Will plan that does not absorb
 * it, and `subscription` is the optional annual add-on. Changing a kind
 * changes how `PriceQuoteBuilder` composes every total, which is why the
 * field explains itself rather than being a bare select.
 */

const KINDS: { value: PlanKind; label: string; hint: string }[] = [
  {
    value: "will",
    label: "Will plan",
    hint: "A tier the client chooses. Charged once per Will.",
  },
  {
    value: "lodging",
    label: "Lodging fee",
    hint: "Compulsory, added to every Will plan that does not include it. Only one is used.",
  },
  {
    value: "subscription",
    label: "Annual subscription",
    hint: "Optional add-on buying free amendments. Only one is used.",
  },
];

const field =
  "w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none";
const labelClass =
  "block font-serif text-[10px] uppercase tracking-[0.28em] text-navy";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Banner({ status, message }: { status: string; message?: string }) {
  if (status === "idle" || !message) return null;

  return (
    <p
      role="status"
      className={`flex items-start gap-2 text-sm ${
        status === "success" ? "text-success" : "text-destructive"
      }`}
    >
      {status === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {message}
    </p>
  );
}

function PlanForm({ plan, onDone }: { plan: Plan | null; onDone: () => void }) {
  const [state, action] = useFormAction(savePlanAction, { onSuccess: onDone });
  const [kind, setKind] = useState<PlanKind>(plan?.kind ?? "will");

  // Naira for a person to read and type; the server converts to kobo.
  const priceNaira = plan ? (plan.price_kobo / 100).toString() : "";

  return (
    <form action={action} className="space-y-6 border border-gold bg-gold/5 p-6 sm:p-8">
      {plan && <input type="hidden" name="planId" value={plan.id} />}

      <Banner status={state.status} message={state.message} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="plan-name" className={labelClass}>
            Name
          </label>
          <input
            id="plan-name"
            name="name"
            required
            maxLength={96}
            defaultValue={plan?.name ?? ""}
            placeholder="Premium"
            className={field}
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="plan-slug" className={labelClass}>
            Slug
          </label>
          <input
            id="plan-slug"
            name="slug"
            required
            maxLength={64}
            pattern="[a-z0-9\-]+"
            defaultValue={plan?.slug ?? ""}
            placeholder="premium"
            className={`${field} font-mono text-sm`}
          />
          <p className="text-[11px] text-muted-foreground">
            Lowercase, hyphens. Used in checkout links — changing it on a live
            plan breaks any saved link to it.
          </p>
          {state.fieldErrors?.slug && (
            <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>
          )}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Kind</legend>
        <div className="mt-3 space-y-2">
          {KINDS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 border border-border bg-background p-3 transition-colors has-[:checked]:border-gold"
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="mt-1 accent-gold"
              />
              <span>
                <span className="block text-sm font-medium text-navy">
                  {option.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="plan-price" className={labelClass}>
            Price (₦)
          </label>
          <input
            id="plan-price"
            name="priceNaira"
            required
            type="number"
            min={0}
            step="0.01"
            defaultValue={priceNaira}
            placeholder="120000"
            className={`${field} tabular-nums`}
          />
          <p className="text-[11px] text-muted-foreground">
            In naira. Check it twice — this is what clients are charged.
          </p>
          {state.fieldErrors?.priceNaira && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.priceNaira[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="plan-sort" className={labelClass}>
            Sort order
          </label>
          <input
            id="plan-sort"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={plan?.sort_order ?? 0}
            className={`${field} tabular-nums`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="plan-tagline" className={labelClass}>
          Tagline
        </label>
        <input
          id="plan-tagline"
          name="tagline"
          maxLength={191}
          defaultValue={plan?.tagline ?? ""}
          placeholder="Reviewed by a lawyer, lodged for you."
          className={field}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="plan-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="plan-description"
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={plan?.description ?? ""}
          className="w-full border border-border bg-background px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="plan-features" className={labelClass}>
          Features — one per line
        </label>
        <textarea
          id="plan-features"
          name="features"
          rows={5}
          defaultValue={(plan?.features ?? []).join("\n")}
          placeholder={"Everything in Basic\nYour Will reviewed by a lawyer"}
          className="w-full border border-border bg-background px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
        />
      </div>

      {kind === "will" && (
        <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="includesLodging"
              defaultChecked={plan?.includes_lodging ?? false}
              className="mt-1 accent-gold"
            />
            <span>
              <span className="block text-sm font-medium text-navy">
                Includes the lodging fee
              </span>
              <span className="block text-xs text-muted-foreground">
                The compulsory registry fee is absorbed rather than added on
                top.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <label htmlFor="plan-months" className={labelClass}>
              Free amendment months
            </label>
            <input
              id="plan-months"
              name="includedSubscriptionMonths"
              type="number"
              min={0}
              max={120}
              defaultValue={plan?.included_subscription_months ?? 0}
              className={`${field} tabular-nums`}
            />
            <p className="text-[11px] text-muted-foreground">
              12 grants a year of free updates with this plan. 0 grants none.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-6 border-t border-border pt-5">
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={plan?.is_active ?? true}
            className="accent-gold"
          />
          On sale
        </label>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            name="isPopular"
            defaultChecked={plan?.is_popular ?? false}
            className="accent-gold"
          />
          Highlight as most chosen
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Submit label={plan ? "Save changes" : "Create plan"} />
        <button
          type="button"
          onClick={onDone}
          className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AvailabilityToggle({ plan }: { plan: Plan }) {
  const [state, action] = useFormAction(setPlanAvailabilityAction);

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="planId" value={plan.id} />
      {/* Posting the opposite of today's value — this button flips it. */}
      {!plan.is_active && <input type="hidden" name="isActive" value="on" />}
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
      >
        {plan.is_active ? "Withdraw" : "Put on sale"}
      </button>
      {state.status === "error" && (
        <span className="text-xs text-destructive">{state.message}</span>
      )}
    </form>
  );
}

export function PlanEditor({ plans }: { plans: Plan[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      {creating ? (
        <PlanForm plan={null} onDone={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 border border-dashed border-border px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-gold hover:text-gold"
        >
          <Plus className="h-4 w-4" />
          Add a plan
        </button>
      )}

      <ul className="divide-y divide-border border border-border bg-background">
        {plans.map((plan) => (
          <li key={plan.id} className="p-5 sm:p-6">
            {editing === plan.id ? (
              <PlanForm plan={plan} onDone={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-serif text-lg text-navy">{plan.name}</h3>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
                      {KINDS.find((k) => k.value === plan.kind)?.label}
                    </span>
                    {!plan.is_active && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-destructive">
                        Withdrawn
                      </span>
                    )}
                    {plan.is_popular && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Most chosen
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-serif text-xl text-navy">
                    {plan.price_formatted}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {plan.charge_suffix}
                    </span>
                  </p>
                  {plan.kind === "will" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.includes_lodging
                        ? "Lodging included"
                        : "Lodging charged separately"}
                      {plan.included_subscription_months > 0 &&
                        ` · ${plan.included_subscription_months} months of free amendments`}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setEditing(plan.id)}
                    className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <AvailabilityToggle plan={plan} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
