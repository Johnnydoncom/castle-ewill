"use client";

import { useFormStatus } from "react-dom";
import { useId, useState } from "react";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

import type { FormState } from "@/lib/actions/state";
import { scorePassword } from "@/lib/auth/password-policy";

/**
 * Editorial form primitives: a hairline-underlined field in the serif voice
 * used across the marketing site, with inline validation messaging.
 */

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  hint,
  autoComplete,
  required,
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  errors?: string[];
}) {
  const id = useId();
  const invalid = Boolean(errors?.length);
  const describedBy = invalid ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="font-serif text-[10px] uppercase tracking-[0.3em] text-navy"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] italic text-muted-foreground">{hint}</span>
        )}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={`w-full border-0 border-b bg-transparent px-0 py-2.5 font-serif text-lg text-navy transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 ${
          invalid
            ? "border-destructive focus:border-destructive"
            : "border-border focus:border-gold"
        }`}
      />
      {invalid && (
        <p id={describedBy} className="text-xs text-destructive">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}

export function PasswordField({
  label,
  name,
  autoComplete,
  errors,
  withMeter = false,
  hint,
}: {
  label: string;
  name: string;
  autoComplete?: string;
  errors?: string[];
  withMeter?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const invalid = Boolean(errors?.length);
  const score = scorePassword(value);
  const labels = ["Too short", "Weak", "Fair", "Strong", "Excellent"];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="font-serif text-[10px] uppercase tracking-[0.3em] text-navy"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] italic text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={`w-full border-0 border-b bg-transparent px-0 py-2.5 pr-10 font-serif text-lg text-navy transition-colors focus:outline-none focus:ring-0 ${
            invalid
              ? "border-destructive focus:border-destructive"
              : "border-border focus:border-gold"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-navy"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {withMeter && value.length > 0 && (
        <div className="flex items-center gap-3 pt-1">
          <div className="flex h-1 flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-full flex-1 rounded-full transition-colors ${
                  i < score ? "bg-gold" : "bg-border"
                }`}
              />
            ))}
          </div>
          <span className="w-20 text-right text-[10px] uppercase tracking-wider text-muted-foreground">
            {labels[score]}
          </span>
        </div>
      )}

      {invalid && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex h-14 w-full items-center justify-center gap-3 bg-navy font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-navy-foreground/30 border-t-navy-foreground"
        />
      )}
      {pending ? "Working…" : children}
    </button>
  );
}

export function FormBanner({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;

  const success = state.status === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 border-l-2 px-4 py-3 text-sm ${
        success
          ? "border-success bg-success/5 text-navy"
          : "border-destructive bg-destructive/5 text-navy"
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${success ? "text-success" : "text-destructive"}`}
      />
      <p className="leading-relaxed">{state.message}</p>
    </div>
  );
}
