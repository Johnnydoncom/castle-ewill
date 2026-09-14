import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminSignInAction, signInAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/state";

/**
 * Signing in to an account with two-factor is two steps: the password, then a
 * code. Asking for the code is not a failure, and must not read as one.
 */

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browser", () => ({ api, apiMutation: vi.fn() }));

beforeEach(() => {
  api.mockReset();
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const refused = (code: string) => ({ ok: false, code, message: "refused" });

describe.each([
  ["customer", signInAction],
  ["admin", adminSignInAction],
])("%s sign-in", (_name, action) => {
  it("moves to the code step without an error once the password is accepted", async () => {
    api.mockResolvedValueOnce(refused("two_factor_required"));

    const state = await action(
      idleState,
      form({ email: " Client@Example.com ", password: "secret" }),
    );

    expect(state.status).toBe("idle");
    expect(state.message).toBeUndefined();
    expect(state.data).toEqual({ challenge: "totp", email: "client@example.com" });
  });

  it("sends the code with the credentials and flags a wrong one on the code field", async () => {
    api.mockResolvedValueOnce(refused("two_factor_invalid"));

    const state = await action(
      idleState,
      form({ email: "client@example.com", password: "secret", totp: "123456" }),
    );

    expect(api).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "client@example.com", password: "secret", totp: "123456" },
    });
    expect(state.status).toBe("error");
    expect(state.data?.challenge).toBe("totp");
    expect(state.fieldErrors?.totp?.[0]).toMatch(/not accepted/);
  });

  it("keeps a wrong password on the credentials step", async () => {
    api.mockResolvedValueOnce(refused("invalid_credentials"));

    const state = await action(
      idleState,
      form({ email: "client@example.com", password: "wrong" }),
    );

    expect(state.status).toBe("error");
    expect(state.data?.challenge).toBeUndefined();
  });
});
