"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  startBankTransferAction,
  startCheckoutAction,
  startFlutterwaveCheckoutAction,
} from "@/lib/actions/payments";
import { idleState } from "@/lib/actions/state";

function Submit({ label, featured }: { label: string; featured: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex h-13 w-full items-center justify-center gap-3 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        featured
          ? "bg-gold text-navy hover:bg-gold/90"
          : "bg-navy text-navy-foreground hover:bg-navy/90"
      }`}
    >
      {pending && (
        <span
          aria-hidden
          className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${
            featured
              ? "border-navy/30 border-t-navy"
              : "border-navy-foreground/30 border-t-navy-foreground"
          }`}
        />
      )}
      {pending ? "Redirecting…" : label}
    </button>
  );
}

/**
 * Posts the plan *slug* only. The price is looked up server-side, so a
 * tampered form cannot change what is charged.
 */
function SecondarySubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-navy disabled:opacity-60"
    >
      {pending ? "Preparing…" : label}
    </button>
  );
}

export function CheckoutButton({
  planSlug,
  planName,
  featured = false,
  flutterwaveEnabled = false,
}: {
  planSlug: string;
  planName: string;
  featured?: boolean;
  /** Resolved on the server; the option is hidden rather than shown broken. */
  flutterwaveEnabled?: boolean;
}) {
  const [cardState, card] = useActionState(startCheckoutAction, idleState);
  const [flwState, flutterwave] = useActionState(
    startFlutterwaveCheckoutAction,
    idleState,
  );
  const [transferState, transfer] = useActionState(
    startBankTransferAction,
    idleState,
  );

  const error =
    [cardState, flwState, transferState].find((s) => s.status === "error")
      ?.message ?? null;

  return (
    <div className="mt-8 space-y-4">
      <form action={card}>
        <input type="hidden" name="planSlug" value={planSlug} />
        <Submit label={`Choose ${planName}`} featured={featured} />
      </form>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {flutterwaveEnabled && (
          <form action={flutterwave}>
            <input type="hidden" name="planSlug" value={planSlug} />
            <SecondarySubmit label="Flutterwave" />
          </form>
        )}
        <form action={transfer}>
          <input type="hidden" name="planSlug" value={planSlug} />
          <SecondarySubmit label="Bank transfer" />
        </form>
      </div>

      {error && (
        <p className="text-xs leading-relaxed text-destructive">{error}</p>
      )}
    </div>
  );
}
