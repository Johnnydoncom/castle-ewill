"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useRef } from "react";

import { idleState, type FormState } from "@/lib/actions/state";

/**
 * Binds a form to a Server Action with client-side side effects (refresh, redirect, onSuccess).
 */

function navigate(
  destination: string,
  router: ReturnType<typeof useRouter>,
  hard = false,
): void {
  /*
   * `hard` bypasses the client Router Cache, which keys on the path alone and
   * has no notion of who is signed in — so a page fetched before signing in
   * is happily replayed afterwards. Only a full document load is guaranteed
   * to re-run the server components with the new session. See
   * `FormState.hardRedirect`.
   */
  if (destination.startsWith("/") && !hard) {
    router.push(destination);
    return;
  }
  window.location.assign(destination);
}

/**
 * `<input name>` → submitted string value.
 *
 * File inputs are skipped — there is no `defaultValue` concept for them, and
 * an unchecked checkbox simply has no entry at all, which is the correct
 * "not on" signal for `fieldChecked`-style lookups downstream.
 */
function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export type ApiFormOptions = {
  refresh?: boolean;
  onSuccess?: (state: FormState) => void;
};

export function useFormAction(
  actionFn: (previous: FormState, formData: FormData) => Promise<FormState>,
  options: ApiFormOptions = {},
): [FormState, (formData: FormData) => void, boolean] {
  const router = useRouter();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const submit = useCallback(
    async (previous: FormState, formData: FormData): Promise<FormState> => {
      let state: FormState;

      try {
        state = await actionFn(previous, formData);
      } catch (err) {
        console.error("[formAction] action failed", err);
        return {
          status: "error",
          message: "Something went wrong. Please try again.",
          values: formValues(formData),
        };
      }

      const { refresh = true, onSuccess } = optionsRef.current;

      if (state.status === "success") {
        onSuccess?.(state);

        /*
         * `router.refresh()` is skipped ahead of a hard redirect. The page is
         * about to be thrown away by a full document load, so refreshing it
         * achieves nothing — but it does re-fetch the *current* route, and if
         * that route now redirects (a signed-in visitor on `/admin/login`
         * does), Next may service that redirect as a client-side navigation
         * out of the Router Cache and race the hard load we actually want.
         */
        if (refresh && !state.hardRedirect) router.refresh();
        if (state.redirect) navigate(state.redirect, router, state.hardRedirect);
        return state;
      }

      if (state.redirect) navigate(state.redirect, router, state.hardRedirect);

      /*
       * React resets a `<form action={fn}>`'s uncontrolled fields once this
       * promise settles, regardless of `status` — it has no notion of an
       * app-level validation error, only a resolved action. Echoing the
       * submission back lets every field's `defaultValue` prefer this over
       * its original value, so the reset lands on what the user just typed
       * rather than wiping it. See FormState.values.
       */
      return { ...state, values: formValues(formData) };
    },
    [actionFn, router],
  );

  return useActionState(submit, idleState);
}

/** Keep backwards compatible alias for useFormAction during transition */
export const useApiForm = useFormAction;
