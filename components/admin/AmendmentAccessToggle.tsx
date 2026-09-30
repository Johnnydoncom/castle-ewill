"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { setAmendmentAccessAction } from "@/lib/actions/review";
import { formatDate } from "@/components/admin/DataTable";

function Submit({ allowed }: { allowed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`mt-4 flex h-11 w-full items-center justify-center px-6 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        allowed
          ? "border border-border text-navy hover:border-gold hover:text-gold"
          : "bg-navy text-navy-foreground hover:bg-navy/90"
      }`}
    >
      {pending ? "Saving…" : allowed ? "Lock it again" : "Allow an update"}
    </button>
  );
}

/**
 * Whether a lawyer may update a Will they have submitted.
 *
 * Locked by default once submitted (2026-09-30); opening it lets the lawyer
 * make one update, and resubmitting locks it again. Staff still never edit a
 * Will — this lets its owner do so.
 */
export function AmendmentAccessToggle({
  willId,
  allowed,
  allowedAt,
}: {
  willId: string;
  allowed: boolean;
  allowedAt: string | null;
}) {
  const [state, action] = useFormAction(setAmendmentAccessAction, { refresh: true });

  return (
    <div className="border border-border bg-background p-6">
      <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">Updates</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {allowed
          ? `Opened for the lawyer to update on ${formatDate(allowedAt)}. It locks again when they resubmit it.`
          : "A lawyer's Will is locked once submitted. Open it only when the lawyer has asked to update it."}
      </p>

      <form action={action}>
        <input type="hidden" name="willId" value={willId} />
        {/* Posting the opposite of today's value — this button flips it. */}
        {!allowed && <input type="hidden" name="allowed" value="on" />}
        <Submit allowed={allowed} />
      </form>

      {state.status !== "idle" && state.message && (
        <p
          role="status"
          className={`mt-3 flex items-start gap-2 text-xs ${
            state.status === "success" ? "text-success" : "text-destructive"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {state.message}
        </p>
      )}
    </div>
  );
}
