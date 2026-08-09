/**
 * Shared shape for mutation results, consumed by `useActionState`.
 *
 * `fieldErrors` is keyed by form field so the client can render messages
 * inline; `message` carries form-level outcomes.
 *
 * This is the JSON body every mutating API route returns. `useActionState`
 * accepts any async `(prev, formData) => state` function, not only a server
 * action, so moving from actions to routes left this contract — and every form
 * that renders it — unchanged.
 */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Optional payload, e.g. the email a verification link was sent to. */
  data?: Record<string, string>;
  /**
   * Where the browser should navigate on success. A route handler cannot
   * `redirect()` the caller of a `fetch`, so the destination is returned and
   * `useApiForm` performs the navigation.
   */
  redirect?: string;
  /**
   * Force a full document load rather than a client-side navigation.
   *
   * Required whenever the *session itself* changed. Next's client Router
   * Cache keys on the path, not on who is signed in, so an entry fetched
   * before signing in is still served afterwards. An administrator who
   * opened `/admin` while signed out got bounced to `/admin/login`, and that
   * bounce is what the cache stored — so `router.push("/admin")` after a
   * successful sign-in replayed it and landed them straight back on the
   * login page. Customers rarely hit it because they reach `/login` from the
   * site nav without having tried `/dashboard` first, which is why this
   * looked like an admin-only fault.
   */
  hardRedirect?: boolean;
  /**
   * The raw fields just submitted, keyed by `<input name>`.
   *
   * React resets a `<form action={fn}>`'s uncontrolled fields to their
   * `defaultValue` whenever the action's promise settles — including on a
   * validation error, since React only sees a resolved promise, not our
   * `status: "error"`. Populated centrally by `useFormAction`, not by
   * individual actions, so every field's `defaultValue` can prefer this over
   * the original server value and the reset becomes invisible: React resets
   * to a value that already equals what the user typed.
   */
  values?: Record<string, string>;
};

export const idleState: FormState = { status: "idle" };

export function errorState(
  message: string,
  fieldErrors?: Record<string, string[]>,
): FormState {
  return { status: "error", message, fieldErrors };
}

export function successState(
  message: string,
  data?: Record<string, string>,
): FormState {
  return { status: "success", message, data };
}

/**
 * Success that also moves the browser somewhere — the API-route equivalent of
 * `redirect()`.
 *
 * Pass `{ hard: true }` for anything that signs a user in or out: see
 * `FormState.hardRedirect` for why a client-side push is not safe there.
 */
export function redirectState(
  to: string,
  message = "",
  options: { hard?: boolean } = {},
): FormState {
  return { status: "success", message, redirect: to, hardRedirect: options.hard };
}

/** Flattens a ZodError into the `fieldErrors` shape. */
export function zodFieldErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}
