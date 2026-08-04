"use client";

import { useFormStatus } from "react-dom";

import { useFormAction } from "@/hooks/use-api-form";
import { setContactStatusAction } from "@/lib/actions/review";

const NEXT: Record<string, { value: string; label: string } | null> = {
  new: { value: "in_progress", label: "Start handling" },
  in_progress: { value: "closed", label: "Mark closed" },
  closed: null,
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-navy underline underline-offset-4 transition-colors hover:text-gold disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * Moves a contact message along `new → in progress → closed`.
 *
 * One button, not a dropdown: the sequence only runs one way, and a select
 * listing states an operator cannot reach from here is a menu of dead options.
 * Reopening a closed message is deliberately not offered — if it needs handling
 * again, the client has written again, and that is a new message.
 */
export function ContactStatus({
  messageId,
  status,
}: {
  messageId: string;
  status: string;
}) {
  const [state, action] = useFormAction(setContactStatusAction);

  const next = NEXT[status] ?? null;

  if (!next) {
    return <span className="text-xs text-muted-foreground/60">&mdash;</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="messageId" value={messageId} />
      <input type="hidden" name="status" value={next.value} />
      <Submit label={next.label} />
      {state.status === "error" && state.message && (
        <p className="mt-1 text-[11px] text-destructive">{state.message}</p>
      )}
    </form>
  );
}
