"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Lock, ServerCog } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { saveSettingsGroupAction } from "@/lib/actions/review";
import type { SettingGroup } from "@/lib/actions/admin";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center bg-navy px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

/**
 * Where a setting's value came from.
 *
 * The most useful thing on this screen. An operator debugging a gateway wants
 * to know whether the value in force is the one they typed here or the one on
 * the server — "configured" alone answers neither.
 */
function Source({ field }: { field: SettingGroup["fields"][number] }) {
  if (field.source === "console") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-success">
        <CheckCircle2 className="h-3 w-3" />
        Set here
      </span>
    );
  }

  if (field.source === "environment") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <ServerCog className="h-3 w-3" />
        From server .env
      </span>
    );
  }

  return (
    <span className="text-[10px] uppercase tracking-[0.16em] text-gold">
      Not configured
    </span>
  );
}

/**
 * One configurable group — payment gateways, identity verification, SMS.
 *
 * Secrets are write-only by design: the server never returns one, so the input
 * starts blank whatever is stored. Leaving it blank keeps the existing value;
 * clearing an override is a separate, deliberate tick, because "I did not type
 * anything" and "remove what is saved" must not be the same gesture on a form
 * that governs live payments.
 */
export function SettingsGroupForm({ group }: { group: SettingGroup }) {
  const [state, action] = useFormAction(saveSettingsGroupAction);

  return (
    <section className="border border-border bg-background p-6 sm:p-8">
      <h2 className="font-serif text-xl text-navy">{group.label}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {group.description}
      </p>

      {state.status === "error" && (
        <p className="mt-5 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="mt-5 border border-success/40 bg-success/5 p-3 text-sm text-success">
          {state.message}
        </p>
      )}

      <form action={action} className="mt-6 space-y-6">
        <input type="hidden" name="group" value={group.key} />

        {group.option && (
          <label className="block border-l-2 border-gold bg-gold/5 p-4">
            <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-navy">
              {group.option.label}
            </span>
            <input type="hidden" name="optionKey" value={group.option.key} />
            <select
              name="option"
              defaultValue={group.option.selected}
              className="mt-2 block w-full max-w-sm border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-navy focus:border-gold focus:outline-none"
            >
              {Object.entries(group.option.choices).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {group.fields.map((field) => (
            <div key={field.key} className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label
                  htmlFor={`${group.key}-${field.key}`}
                  className="font-serif text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
                >
                  {field.secret && (
                    <Lock className="mr-1.5 inline h-3 w-3 text-gold" />
                  )}
                  {field.label}
                </label>
                <Source field={field} />
              </div>

              <input
                id={`${group.key}-${field.key}`}
                name={`field.${field.key}`}
                type={field.secret ? "password" : "text"}
                autoComplete="off"
                // A secret is never sent back, so its box always starts empty;
                // a non-secret shows what is actually in force.
                defaultValue={field.secret ? "" : (field.value ?? "")}
                placeholder={
                  field.secret && field.is_set
                    ? "Saved — type to replace"
                    : undefined
                }
                className="mt-2 w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-navy placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
              />

              {field.hint && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {field.hint}
                </p>
              )}

              {field.source === "console" && (
                <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name={`clear.${field.key}`}
                    className="h-3.5 w-3.5 accent-navy"
                  />
                  Clear this and fall back to the server&rsquo;s .env
                </label>
              )}
            </div>
          ))}
        </div>

        <Submit />
      </form>
    </section>
  );
}
