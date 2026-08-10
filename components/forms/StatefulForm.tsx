"use client";

import { createContext, useContext } from "react";

import { idleState, type FormState } from "@/lib/actions/state";

/**
 * A form that hands its own result down to its fields.
 *
 * Every field needs two things back from a failed submission: the value the
 * user typed, and the errors against its own name. Threading both through
 * props meant every call site had to remember, and none of the auth forms
 * did — `FormState.values` was populated on every error and read by nobody,
 * so the register form dutifully blanked itself each time.
 *
 * Providing the state instead makes it impossible to forget: a field looks
 * itself up by `name`. Props still win where a field genuinely needs
 * something else.
 */

const FormStateContext = createContext<FormState>(idleState);

export function StatefulForm({
  state,
  action,
  children,
  ...formProps
}: {
  state: FormState;
  action: (formData: FormData) => void;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"form">, "action">) {
  return (
    <FormStateContext.Provider value={state}>
      <form action={action} {...formProps}>
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

/**
 * What the last submission said about one field.
 *
 * Returns `undefined` for the value when there is nothing to restore, which
 * is what lets `useFieldValue` tell "no submission yet" from "submitted
 * empty".
 */
export function useFieldState(name: string): {
  value: string | undefined;
  errors: string[] | undefined;
} {
  const state = useContext(FormStateContext);

  return {
    value: state.values?.[name],
    errors: state.fieldErrors?.[name],
  };
}
