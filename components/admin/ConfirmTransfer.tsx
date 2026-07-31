"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { confirmBankTransferAction } from "@/lib/actions/payments";
import { idleState } from "@/lib/actions/state";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-navy underline underline-offset-4 transition-colors hover:text-gold disabled:opacity-50"
    >
      {pending ? "Confirming…" : "Mark received"}
    </button>
  );
}

/**
 * Only rendered for pending bank transfers. Card payments settle from the
 * provider webhook and must never be confirmed by hand — the server enforces
 * this too.
 */
export function ConfirmTransfer({ reference }: { reference: string }) {
  const [state, action] = useActionState(confirmBankTransferAction, idleState);

  if (state.status === "success") {
    return <span className="text-xs text-success">Confirmed</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="reference" value={reference} />
      <Submit />
      {state.status === "error" && state.message && (
        <p className="mt-1 text-[11px] text-destructive">{state.message}</p>
      )}
    </form>
  );
}
