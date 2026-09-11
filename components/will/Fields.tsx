"use client";

import { useId } from "react";

import { useFieldValue } from "@/hooks/use-field-value";

/**
 * Wizard field primitives — same editorial voice as the auth forms, and
 * controlled for the same reason.
 *
 * `StepForms` already echoes the submitted values back through
 * `state.values`, but feeding them to an uncontrolled input's `defaultValue`
 * changes nothing once it is mounted: React resets the form when the action
 * settles and the field goes blank regardless. Holding the value in React is
 * what makes the echo take effect. See `useFieldValue`.
 */

type Common = {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  errors?: string[];
  className?: string;
  /**
   * Shown, but not the client's to change.
   *
   * Read-only rather than disabled: a disabled input is dropped from the
   * submission entirely, and this value still belongs in it. The server
   * decides the value either way — see `withTestatorName()` — so this is a
   * courtesy that saves somebody typing a name that would be replaced.
   */
  readOnly?: boolean;
};

function Label({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <label
        htmlFor={htmlFor}
        className="font-serif text-[10px] uppercase tracking-[0.28em] text-navy"
      >
        {label}
      </label>
      {hint && (
        <span className="text-[10px] italic text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

const inputClass = (invalid: boolean) =>
  `w-full border-0 border-b bg-transparent px-0 py-2.5 font-serif text-base text-navy transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 ${
    invalid
      ? "border-destructive focus:border-destructive"
      : "border-border focus:border-gold"
  }`;

export function TextField({
  type = "text",
  placeholder,
  ...props
}: Common & { type?: string; placeholder?: string }) {
  const id = useId();
  const invalid = Boolean(props.errors?.length);
  const [value, setValue] = useFieldValue(props.defaultValue);

  return (
    <div className={`space-y-2 ${props.className ?? ""}`}>
      <Label htmlFor={id} label={props.label} hint={props.hint} />
      <input
        id={id}
        name={props.name}
        type={type}
        required={props.required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        readOnly={props.readOnly}
        aria-invalid={invalid}
        className={`${inputClass(invalid)} ${props.readOnly ? "cursor-not-allowed text-muted-foreground" : ""}`}
      />
      {invalid && (
        <p className="text-xs text-destructive">{props.errors?.[0]}</p>
      )}
    </div>
  );
}

export function TextArea({
  rows = 4,
  placeholder,
  ...props
}: Common & { rows?: number; placeholder?: string }) {
  const id = useId();
  const invalid = Boolean(props.errors?.length);
  const [value, setValue] = useFieldValue(props.defaultValue);

  return (
    <div className={`space-y-2 ${props.className ?? ""}`}>
      <Label htmlFor={id} label={props.label} hint={props.hint} />
      <textarea
        id={id}
        name={props.name}
        rows={rows}
        required={props.required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={invalid}
        className={`w-full resize-y border border-border bg-transparent px-3 py-2.5 font-serif text-base text-navy transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/50 focus:border-gold focus:outline-none focus:ring-0 ${
          invalid ? "border-destructive" : ""
        }`}
      />
      {invalid && (
        <p className="text-xs text-destructive">{props.errors?.[0]}</p>
      )}
    </div>
  );
}

export function SelectField({
  options,
  placeholder,
  ...props
}: Common & {
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const id = useId();
  const invalid = Boolean(props.errors?.length);
  const seed = props.defaultValue ?? "";

  return (
    <div className={`space-y-2 ${props.className ?? ""}`}>
      <Label htmlFor={id} label={props.label} hint={props.hint} />
      <select
        /*
          Uncontrolled, and re-mounted whenever the value to show changes.

          Not `useFieldValue`, unlike the text fields. React resets a form once
          its action settles, and a controlled `<select>` does not survive it:
          the reset puts the element back to its default while React's state
          still holds the choice, so nothing re-renders to put it back and the
          next submission posts an empty field. A client who chose a marital
          status and state, then mistyped their NIN, saw both return to
          "Select…" — and was refused for them on the next press.

          The default *is* the last submission (callers pass `fieldValue`), so
          the reset lands on what was chosen; the key re-mounts the element
          when that changes, because a mounted select ignores a new default.
        */
        key={seed}
        id={id}
        name={props.name}
        required={props.required}
        defaultValue={seed}
        aria-invalid={invalid}
        className={inputClass(invalid)}
      >
        <option value="" disabled>
          {placeholder ?? "Select…"}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {invalid && (
        <p className="text-xs text-destructive">{props.errors?.[0]}</p>
      )}
    </div>
  );
}

export function CheckboxField({
  name,
  children,
  defaultChecked,
  errors,
}: {
  name: string;
  children: React.ReactNode;
  defaultChecked?: boolean;
  errors?: string[];
}) {
  const invalid = Boolean(errors?.length);

  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 text-sm leading-relaxed text-navy/85">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border text-navy focus:ring-gold"
        />
        <span>{children}</span>
      </label>
      {invalid && <p className="pl-7 text-xs text-destructive">{errors?.[0]}</p>}
    </div>
  );
}

export function RadioCards({
  name,
  options,
  defaultValue,
  errors,
}: {
  name: string;
  options: ReadonlyArray<{ value: string; label: string; description?: string }>;
  defaultValue?: string;
  errors?: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="group flex cursor-pointer flex-col gap-1 border border-border p-4 transition-colors hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold/5"
          >
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                name={name}
                value={option.value}
                defaultChecked={defaultValue === option.value}
                className="h-4 w-4 border-border text-navy focus:ring-gold"
              />
              <span className="font-serif text-base text-navy">
                {option.label}
              </span>
            </span>
            {option.description && (
              <span className="pl-7 text-xs leading-relaxed text-muted-foreground">
                {option.description}
              </span>
            )}
          </label>
        ))}
      </div>
      {errors?.length ? (
        <p className="text-xs text-destructive">{errors[0]}</p>
      ) : null}
    </div>
  );
}
