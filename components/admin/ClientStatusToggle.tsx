"use client";

import { useFormAction } from "@/hooks/use-api-form";
import { setClientStatusAction } from "@/lib/actions/review";

import { useFormStatus } from "react-dom";

function Submit({ suspended }: { suspended: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-xs underline underline-offset-4 transition-colors disabled:opacity-50 ${
        suspended
          ? "text-muted-foreground hover:text-success"
          : "text-muted-foreground hover:text-destructive"
      }`}
    >
      {pending ? "Saving…" : suspended ? "Reactivate" : "Suspend"}
    </button>
  );
}

export function ClientStatusToggle({
  userId,
  status,
  isSelf,
  isAdmin,
}: {
  userId: string;
  status: string;
  isSelf: boolean;
  isAdmin: boolean;
}) {
  const [state, action] = useFormAction(setClientStatusAction);

  // The server refuses both cases too; hiding the control avoids offering an
  // action that can only fail.
  if (isSelf || isAdmin) {
    return <span className="text-xs text-muted-foreground/60">&mdash;</span>;
  }

  const suspended = status === "suspended";

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input
        type="hidden"
        name="status"
        value={suspended ? "active" : "suspended"}
      />
      <Submit suspended={suspended} />
      {state.status === "error" && state.message && (
        <p className="mt-1 text-[11px] text-destructive">{state.message}</p>
      )}
    </form>
  );
}
