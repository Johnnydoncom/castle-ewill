"use client";

import { useFormStatus } from "react-dom";

import { useFormAction } from "@/hooks/use-api-form";
import { updateAdminPermissionsAction, setAdminStatusAction } from "@/lib/actions/review";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-9 border border-border px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save permissions"}
    </button>
  );
}

function StatusButton({ suspended }: { suspended: boolean }) {
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

/**
 * One delegated admin's permission checklist plus their status control.
 *
 * Never rendered for the superadmin — the page filters that row out before
 * this component sees it, since there is nothing here to edit for an
 * account that already passes every check.
 */
export function AdminPermissionsEditor({
  userId,
  currentPermissions,
  status,
  isSelf,
}: {
  userId: string;
  currentPermissions: string[];
  status: string;
  isSelf: boolean;
}) {
  const [permState, permAction] = useFormAction(updateAdminPermissionsAction, { refresh: true });
  const [statusState, statusAction] = useFormAction(setAdminStatusAction, { refresh: true });

  const suspended = status === "suspended";

  return (
    <div className="space-y-4">
      <form action={permAction} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <div className="grid gap-2 sm:grid-cols-2">
          {ADMIN_PERMISSIONS.map((permission) => (
            <label
              key={permission.value}
              className="flex cursor-pointer items-center gap-2.5 border border-border px-3 py-2 text-sm transition-colors hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/5"
            >
              <input
                type="checkbox"
                name="permissions"
                value={permission.value}
                defaultChecked={currentPermissions.includes(permission.value)}
                className="h-4 w-4 shrink-0 border-border text-navy focus:ring-gold"
              />
              {permission.label}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <SaveButton />
          {permState.status === "error" && permState.message && (
            <p className="text-xs text-destructive">{permState.message}</p>
          )}
          {permState.status === "success" && (
            <p className="text-xs text-success">Saved.</p>
          )}
        </div>
      </form>

      {!isSelf && (
        <form action={statusAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="status" value={suspended ? "active" : "suspended"} />
          <StatusButton suspended={suspended} />
          {statusState.status === "error" && statusState.message && (
            <p className="mt-1 text-[11px] text-destructive">{statusState.message}</p>
          )}
        </form>
      )}
    </div>
  );
}
