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
): void {
  if (destination.startsWith("/")) {
    router.push(destination);
    return;
  }
  window.location.assign(destination);
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
        };
      }

      const { refresh = true, onSuccess } = optionsRef.current;

      if (state.status === "success") {
        onSuccess?.(state);
        if (refresh) router.refresh();
        if (state.redirect) navigate(state.redirect, router);
      } else if (state.redirect) {
        navigate(state.redirect, router);
      }

      return state;
    },
    [actionFn, router],
  );

  return useActionState(submit, idleState);
}

/** Keep backwards compatible alias for useFormAction during transition */
export const useApiForm = useFormAction;
