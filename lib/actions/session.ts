import { api } from "@/lib/api/browser";
import { redirectState, type FormState } from "@/lib/actions/state";

/**
 * Signs out.
 *
 * A direct browser call to Laravel, not a server action: `POST /auth/logout`
 * ends the Sanctum session and rotates the cookie, so there is nothing left
 * here to proxy. A failure is logged rather than surfaced — the browser is
 * sent home either way, and a session that failed to revoke expires on its
 * own regardless.
 */
export async function signOutAction(): Promise<FormState> {
  const result = await api("/auth/logout", { method: "POST" });

  if (!result.ok) {
    console.error(`[auth] sign-out failed: ${result.message}`);
  }

  return redirectState("/", "Signed out.");
}
