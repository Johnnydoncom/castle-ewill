"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { createAdminAction } from "@/lib/actions/review";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending invitation…" : "Add administrator"}
    </button>
  );
}

/**
 * Creates a new, scoped admin account and emails an invitation.
 *
 * The new account has no usable password — the invitation link (a
 * password-reset token under the hood) is the only way in, so there is
 * nothing here that could leak a credential in transit.
 */
export function CreateAdminForm() {
  const [state, action] = useFormAction(createAdminAction, { refresh: true });

  const field =
    "w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none";
  const labelClass = "block font-serif text-[10px] uppercase tracking-[0.28em] text-navy";

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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="new-admin-first-name" className={labelClass}>
            First name
          </label>
          <input
            id="new-admin-first-name"
            name="firstName"
            required
            maxLength={96}
            placeholder="Chidi"
            className={field}
          />
          {state.fieldErrors?.firstName && (
            <p className="text-xs text-destructive">{state.fieldErrors.firstName[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="new-admin-last-name" className={labelClass}>
            Surname
          </label>
          <input
            id="new-admin-last-name"
            name="lastName"
            required
            maxLength={96}
            placeholder="Okonkwo"
            className={field}
          />
          {state.fieldErrors?.lastName && (
            <p className="text-xs text-destructive">{state.fieldErrors.lastName[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="new-admin-email" className={labelClass}>
            Email
          </label>
          <input
            id="new-admin-email"
            name="email"
            type="email"
            required
            maxLength={191}
            placeholder="chidi@castlewilltrust.com"
            className={field}
          />
          {state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className={labelClass}>Sections they can access</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ADMIN_PERMISSIONS.map((permission) => (
            <label
              key={permission.value}
              className="flex cursor-pointer items-start gap-2.5 border border-border p-3 transition-colors hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/5"
            >
              <input
                type="checkbox"
                name="permissions"
                value={permission.value}
                className="mt-0.5 h-4 w-4 shrink-0 border-border text-navy focus:ring-gold"
              />
              <span>
                <span className="block text-sm font-medium text-navy">
                  {permission.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {permission.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          No sections is a valid choice — permissions can be granted later.
        </p>
      </div>

      <Submit />
    </form>
  );
}
