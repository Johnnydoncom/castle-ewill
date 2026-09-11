"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { setVerificationRequirementsAction } from "@/lib/actions/review";

export type VerificationRequirements = {
  email: boolean;
  phone: boolean;
  witnesses: boolean;
};

const OPTIONS: {
  key: keyof VerificationRequirements;
  label: string;
  hint: string;
  warning?: string;
}[] = [
  {
    key: "email",
    label: "Confirm email address",
    hint: "Clients must click a link sent to their address before they can start a Will.",
    warning:
      "Every link the product sends goes to this address — the verification link, a password reset, the notice that a Will was approved. Switching it off means none of those are ever proven to arrive.",
  },
  {
    key: "phone",
    label: "Confirm phone number",
    hint: "Clients are asked to confirm a phone number by one-time code. Nothing is ever blocked on it — it is a second channel, not a gate.",
  },
  {
    key: "witnesses",
    label: "Verify witnesses' identity",
    hint: "Both witnesses' identity is checked with Smile ID, and a Will cannot be printed until both are confirmed. Off: clients name their witnesses and print without a check, and the witness panel is hidden.",
  },
];

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

/**
 * Which contact details a client is asked to confirm — and whether their
 * witnesses are checked, which `WillJourney::printBlockedBy()` enforces.
 *
 * Enforced server-side by `EnsureEmailIsVerified`, which reads the setting at
 * the point of use — so turning email confirmation off opens every gated
 * route at once rather than depending on someone having removed the
 * middleware from each of them.
 */
export function VerificationRequirementsForm({
  current,
}: {
  current: VerificationRequirements;
}) {
  const [state, action] = useFormAction(setVerificationRequirementsAction);

  return (
    <form action={action} className="space-y-5">
      {state.status !== "idle" && state.message && (
        <p
          role="status"
          className={`flex items-start gap-2 text-sm ${
            state.status === "success" ? "text-success" : "text-destructive"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {state.message}
        </p>
      )}

      <div className="space-y-2">
        {OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-3 border border-border p-4 transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5"
          >
            <input
              type="checkbox"
              name={option.key}
              defaultChecked={current[option.key]}
              className="mt-1 accent-gold"
            />
            <span className="min-w-0">
              <span className="block font-serif text-base text-navy">
                {option.label}
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                {option.hint}
              </span>
              {option.warning && (
                <span className="mt-1.5 block text-xs leading-relaxed text-destructive">
                  {option.warning}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      <Submit />
    </form>
  );
}
