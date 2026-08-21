"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  approveWillAction,
  requestChangesAction,
  markExecutedAction,
  markLodgedAction,
} from "@/lib/actions/review";
import { type FormState } from "@/lib/actions/state";

function Result({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  const Icon = ok ? CheckCircle2 : AlertCircle;

  return (
    <p
      role="status"
      className={`flex items-start gap-2 text-xs ${ok ? "text-success" : "text-destructive"}`}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {state.message}
    </p>
  );
}

function Submit({
  label,
  busyLabel,
  variant,
}: {
  label: string;
  busyLabel: string;
  variant: "primary" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();

  const classes =
    variant === "primary"
      ? "bg-navy text-navy-foreground hover:bg-navy/90"
      : variant === "danger"
        ? "border border-destructive/50 text-destructive hover:bg-destructive/5"
        : "border border-border text-navy hover:border-gold hover:text-gold";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex h-11 items-center justify-center gap-2 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}
    >
      {pending ? busyLabel : label}
    </button>
  );
}

export function ReviewActions({
  willId,
  status,
  lodgedAt,
  lodgingReference,
}: {
  willId: string;
  status: string;
  /** When this Will was lodged with the registry, if it has been. */
  lodgedAt?: string | null;
  lodgingReference?: string | null;
}) {
  const [approveState, approve] = useFormAction(approveWillAction);
  const [changesState, requestChanges] = useFormAction(requestChangesAction);
  const [executedState, markExecuted] = useFormAction(markExecutedAction);
  const [lodgedState, markLodged] = useFormAction(markLodgedAction);
  const [showChanges, setShowChanges] = useState(false);

  const inReview = status === "submitted" || status === "under_review";

  return (
    <div className="space-y-6 border border-border bg-surface p-6">
      <div>
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          Reviewer actions
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {inReview
            ? "Approve this Will, or return it to the client with a note explaining what needs to change."
            : status === "approved"
              ? "This Will is approved. Mark it executed once the client confirms it has been signed and witnessed."
              : status === "draft"
                ? "This Will is with the client and cannot be actioned until it is submitted."
                : status === "executed" && lodgedAt === null
                  ? "This Will is signed and witnessed. Record the lodging once it has been filed with the Probate Registry."
                  : "No further action is available for this Will."}
        </p>
      </div>

      {inReview && (
        <div className="space-y-4">
          <form action={approve} className="space-y-2">
            <input type="hidden" name="willId" value={willId} />
            <Submit label="Approve Will" busyLabel="Approving…" variant="primary" />
            <Result state={approveState} />
          </form>

          {showChanges ? (
            <form action={requestChanges} className="space-y-3">
              <input type="hidden" name="willId" value={willId} />
              <label
                htmlFor="review-reason"
                className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
              >
                What needs to change?
              </label>
              <textarea
                id="review-reason"
                name="reason"
                rows={4}
                required
                placeholder="The residuary shares total 90%. Please revisit step four."
                className="w-full resize-y border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
              />
              {changesState.fieldErrors?.reason && (
                <p className="text-xs text-destructive">
                  {changesState.fieldErrors.reason[0]}
                </p>
              )}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                This note is emailed to the client verbatim, and the Will is
                returned to draft so they can amend it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Submit
                  label="Send & return to draft"
                  busyLabel="Sending…"
                  variant="danger"
                />
                <button
                  type="button"
                  onClick={() => setShowChanges(false)}
                  className="h-11 px-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-navy"
                >
                  Cancel
                </button>
              </div>
              <Result state={changesState} />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowChanges(true)}
              className="flex h-11 items-center justify-center border border-border px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
            >
              Request changes
            </button>
          )}
        </div>
      )}

      {status === "approved" && (
        <form action={markExecuted} className="space-y-2">
          <input type="hidden" name="willId" value={willId} />
          <Submit
            label="Mark as executed"
            busyLabel="Recording…"
            variant="outline"
          />
          <Result state={executedState} />
        </form>
      )}

      {/*
        Lodging is a person at a registry counter, so this records that it
        happened rather than doing it. Until it is recorded the client's
        journey cannot leave the Lodge stage — there is no other way for the
        product to learn that the filing took place.
      */}
      {status === "executed" && !lodgedAt && (
        <form action={markLodged} className="space-y-3">
          <input type="hidden" name="willId" value={willId} />

          <label
            htmlFor="lodging-reference"
            className="block font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
          >
            Registry reference
          </label>
          <input
            id="lodging-reference"
            name="lodgingReference"
            type="text"
            placeholder="PR/LAG/2026/0041"
            className="w-full border border-border bg-background px-3 py-2.5 font-serif text-sm text-navy focus:border-gold focus:outline-none"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Optional — a registry may not issue one at the counter. Record the
            lodging either way; the reference can be the only durable evidence
            it happened, and it is what a family is asked for years later.
          </p>

          <Submit
            label="Record as lodged"
            busyLabel="Recording…"
            variant="outline"
          />
          <Result state={lodgedState} />
        </form>
      )}

      {lodgedAt && (
        <p className="border-l-2 border-gold bg-gold/5 px-4 py-3 text-xs leading-relaxed text-navy">
          Lodged with the Probate Registry
          {lodgingReference ? ` under ${lodgingReference}` : ""}.
        </p>
      )}
    </div>
  );
}
