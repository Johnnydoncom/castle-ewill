"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { setVerificationProviderAction } from "@/lib/actions/review";
import type { VerificationProviderName } from "@/lib/actions/admin";

const OPTIONS: { value: VerificationProviderName; label: string; hint: string }[] = [
  {
    value: "dojah",
    label: "Dojah",
    hint: "Registry lookup, liveness and face match against Dojah's API.",
  },
  {
    value: "smile_id",
    label: "Smile ID",
    hint: "One Biometric KYC job covers the registry lookup, liveness and face match.",
  },
  {
    value: "manual_review",
    label: "Manual review",
    hint: "No vendor call — every attempt is queued for a person to decide.",
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
 * Which KYC vendor is live right now — an admin-editable setting rather than
 * a deploy-time env value, same "correcting this should not require a
 * redeploy" reasoning as `BankAccountForm`. See
 * `Setting::activeVerificationProvider()` on the backend.
 */
export function VerificationProviderForm({
  current,
}: {
  current: VerificationProviderName;
}) {
  const [state, action] = useFormAction(setVerificationProviderAction);

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
            key={option.value}
            className="flex cursor-pointer items-start gap-3 border border-border p-4 transition-colors has-[:checked]:border-gold has-[:checked]:bg-gold/5"
          >
            <input
              type="radio"
              name="provider"
              value={option.value}
              defaultChecked={option.value === current}
              className="mt-1 accent-gold"
            />
            <span>
              <span className="block font-serif text-base text-navy">
                {option.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </div>

      <Submit />
    </form>
  );
}
