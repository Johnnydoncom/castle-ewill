import { api } from "@/lib/api/browser";
import type { AdminWillAccess, WillAccessScope } from "@/lib/will/access";

/**
 * Staff access to a Will, from the browser straight to Laravel.
 *
 * The client grants and withdraws; a member of staff claims with the code the
 * client read to them. The backend is the whole rule (`WillAccess`) — nothing
 * here decides who may read what.
 */

type Outcome<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** Issues a support code. The code exists only in this response. */
export async function grantSupportAccess(
  willId: string,
  input: { scope: WillAccessScope; durationHours: number; consent: boolean },
): Promise<Outcome<{ code: string }>> {
  const result = await api<{ data: { code: string } }>(`/wills/${willId}/access-grants`, {
    method: "POST",
    body: {
      scope: input.scope,
      duration_hours: input.durationHours,
      consent: input.consent,
    },
  });

  if (!result.ok) {
    return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
  }

  return { ok: true, data: { code: result.data.data.code } };
}

export async function withdrawAccess(willId: string, grantId: string): Promise<Outcome> {
  const result = await api(`/wills/${willId}/access-grants/${grantId}`, { method: "DELETE" });

  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

/** The console's side: claim the code a client read out. */
export async function claimWillAccess(
  willId: string,
  code: string,
): Promise<Outcome<{ access: AdminWillAccess }>> {
  const result = await api<{ data: { access: AdminWillAccess } }>(
    `/admin/wills/${willId}/access/claim`,
    { method: "POST", body: { code } },
  );

  if (!result.ok) {
    return {
      ok: false,
      message: result.fieldErrors?.code?.[0] ?? result.message,
      fieldErrors: result.fieldErrors,
    };
  }

  return { ok: true, data: { access: result.data.data.access } };
}
