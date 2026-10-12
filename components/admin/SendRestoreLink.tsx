"use client";

import { useFormStatus } from "react-dom";

import { useFormAction } from "@/hooks/use-api-form";
import { sendRestoreLinkAction } from "@/lib/actions/review";

function Submit({ resend }: { resend: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-success disabled:opacity-50"
    >
      {pending ? "Sending…" : resend ? "Send a new link" : "Send restore link"}
    </button>
  );
}

/**
 * Emails a closed account the link that reopens it.
 *
 * Only on the client's own request — by phone or email — and only ever to the
 * address the account was closed with. Nothing reopens until the client
 * follows the link; sending a new one cancels the last.
 */
export function SendRestoreLink({
  userId,
  hasPendingLink,
}: {
  userId: string;
  hasPendingLink: boolean;
}) {
  const [state, action] = useFormAction(sendRestoreLinkAction, { refresh: true });

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <Submit resend={hasPendingLink} />
      {state.message && (
        <p
          className={`mt-1 max-w-56 text-[11px] ${
            state.status === "error" ? "text-destructive" : "text-success"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
