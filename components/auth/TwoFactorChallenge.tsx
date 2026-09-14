"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import type { FormState } from "@/lib/actions/state";
import { COMPANY } from "@/lib/company";
import { SubmitButton } from "./FormControls";

/** Whether the last sign-in attempt is waiting on an authenticator code. */
export function isTwoFactorChallenge(state: FormState): boolean {
  return state.data?.challenge === "totp";
}

/**
 * The second step of signing in, shown once the password has been accepted.
 *
 * It renders inside the sign-in form, which keeps the email and password
 * mounted but hidden: `/auth/login` is stateless, so the code is sent together
 * with the credentials that were just accepted.
 *
 * The code box is uncontrolled, so React's reset after each attempt empties
 * it, and the cursor is put back in it. Six digits submit on their own —
 * which is also what a pasted code or the phone's one-time-code suggestion
 * produces.
 */
export function TwoFactorChallenge({
  state,
  onBack,
}: {
  state: FormState;
  onBack: () => void;
}) {
  const { pending } = useFormStatus();
  const error = state.fieldErrors?.totp?.[0];
  const email = state.data?.email;
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, [state]);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-navy-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
            Two-step verification
          </p>
          <h2 className="mt-1 font-serif text-2xl text-navy">
            Enter your authentication code
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Open your authenticator app and enter the 6-digit code shown for{" "}
            {COMPANY.name}
            {email ? (
              <>
                {" "}
                to finish signing in as{" "}
                <span className="break-all font-medium text-navy">{email}</span>
              </>
            ) : null}
            .
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="sign-in-totp"
          className="font-serif text-[10px] uppercase tracking-[0.3em] text-navy"
        >
          6-digit code
        </label>
        <input
          ref={input}
          id="sign-in-totp"
          name="totp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "sign-in-totp-error" : undefined}
          onChange={(event) => {
            const input = event.currentTarget;
            const digits = input.value.replace(/\D/g, "").slice(0, 6);
            if (digits !== input.value) input.value = digits;
            if (digits.length === 6 && !pending) input.form?.requestSubmit();
          }}
          className={`w-full border-0 border-b bg-transparent px-0 py-3 text-center font-mono text-3xl tracking-[0.5em] text-navy transition-colors placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 ${
            error
              ? "border-destructive focus:border-destructive"
              : "border-border focus:border-gold"
          }`}
        />
        {error && (
          <p id="sign-in-totp-error" role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <SubmitButton>Verify and sign in</SubmitButton>

      <button
        type="button"
        onClick={onBack}
        disabled={pending}
        className="inline-flex items-center gap-2 text-xs italic text-muted-foreground transition-colors hover:text-navy disabled:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Use a different account
      </button>
    </div>
  );
}
