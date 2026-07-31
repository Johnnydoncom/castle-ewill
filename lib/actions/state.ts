/**
 * Shared shape for server-action results consumed by `useActionState`.
 *
 * `fieldErrors` is keyed by form field so the client can render messages
 * inline; `message` carries form-level outcomes.
 */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Optional payload, e.g. the email a verification link was sent to. */
  data?: Record<string, string>;
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
