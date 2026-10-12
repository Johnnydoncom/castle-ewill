"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { useFormAction } from "@/hooks/use-api-form";
import { closeAccountAction } from "@/lib/actions/account.client";
import { FormBanner, PasswordField } from "@/components/auth/FormControls";
import { StatefulForm } from "@/components/forms/StatefulForm";

/**
 * Withdrawing consent and closing the account (NDPA 2023).
 *
 * Folded away behind one button, and opened in place rather than in a popup,
 * so nobody closes an account by brushing past it and nobody loses the page
 * they were reading. What closing does is spelled out before the password is
 * asked for — it cannot be undone from here, and the client should not learn
 * that from the confirmation email.
 *
 * The backend decides everything that matters: the password, who may close
 * (never staff), what is soft-deleted and when it is erased.
 *
 * `forClients` is a verified lawyer: their account holds Wills they drew for
 * other people, and closing it takes those with it.
 */
export function CloseAccountForm({ forClients = false }: { forClients?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormAction(closeAccountAction);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center border border-destructive/60 px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-destructive transition-colors hover:bg-destructive/5"
      >
        Close my account
      </button>
    );
  }

  return (
    <StatefulForm state={state} action={action} className="space-y-6" noValidate>
      <div className="border-l-2 border-destructive/60 bg-destructive/5 px-5 py-4">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-destructive">
          Before you close
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-navy/80">
          <li>
            You are signed out at once, and you will not be able to sign in
            again.
          </li>
          <li>
            {forClients
              ? "Every Will on your account, including those you have drawn for clients, and every document in your vault can no longer be reached by you or by our staff."
              : "Your Will and every document in your vault can no longer be reached by you or by our staff."}{" "}
            Download anything you want to keep first.
          </li>
          <li>
            We stop processing your personal data. It is held securely for six
            months and then permanently erased.
          </li>
          <li>
            Records the law requires us to keep, such as tax invoices for your
            payments, are kept without your name or contact details.
          </li>
          <li>
            A paper Will you have already signed and had witnessed is not
            affected. Closing your account does not revoke it.
          </li>
        </ul>
      </div>

      <FormBanner state={state} />

      <PasswordField
        label="Your password"
        name="currentPassword"
        autoComplete="current-password"
        errors={state.fieldErrors?.currentPassword}
      />

      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          {/*
            * Uncontrolled, with its default taken from the last submission:
            * React resets a form's fields whenever its action settles, even
            * on an error, and a box that unticks itself after a wrong
            * password reads as though the form ignored the tick.
            */}
          <input
            type="checkbox"
            name="understood"
            defaultChecked={state.values?.understood === "on"}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-navy focus:ring-gold"
          />
          <span>
            I understand that closing my account cannot be undone, and that my
            data will be permanently erased after six months.
          </span>
        </label>
        {state.fieldErrors?.understood && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.understood[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <CloseButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-14 items-center justify-center border border-border px-8 font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy transition-colors hover:border-navy"
        >
          Keep my account
        </button>
      </div>
    </StatefulForm>
  );
}

function CloseButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 flex-1 items-center justify-center gap-3 bg-destructive font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground"
        />
      )}
      {pending ? "Closing…" : "Close my account"}
    </button>
  );
}
