import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  startCheckoutAction,
} from "@/lib/actions/payments.client";

/**
 * The main checkout button must not name a gateway.
 *
 * The server picks one from Settings, and sending a provider overrides that.
 * This action hard-coded "nomba" from the release that made Nomba primary, so
 * switching the active gateway in the console changed the setting, the screen,
 * and nothing that actually took money — every payment still went to Nomba.
 */

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browser", () => ({ api }));

function selection(): FormData {
  const form = new FormData();

  form.set("planSlug", "basic");

  return form;
}

beforeEach(() => {
  api.mockReset();
  api.mockResolvedValue({
    ok: true,
    data: { data: { checkout_url: "https://gateway.example/pay/1" } },
  });
});

describe("the main checkout button", () => {
  it("names no provider, so Settings decides which gateway charges", async () => {
    await startCheckoutAction({ status: "idle" }, selection());

    const [, options] = api.mock.calls[0];

    expect(options.body).not.toHaveProperty("provider");
  });

  it("still sends the selection itself", async () => {
    await startCheckoutAction({ status: "idle" }, selection());

    const [path, options] = api.mock.calls[0];

    expect(path).toBe("/payments/checkout");
    expect(options.body.plan_slug).toBe("basic");
  });
});

describe("the gateway", () => {
  it("is never named by the browser", async () => {
    await startCheckoutAction({ status: "idle" }, selection());

    const [, options] = api.mock.calls[0];

    /*
     * The server names the active gateway in Settings. Sending one from here
     * overrides it, which is exactly what went wrong once before: the browser
     * hard-coded "nomba", so switching the gateway in the console changed the
     * setting, the screen, and nothing else.
     *
     * The buttons that named a gateway are gone with it — on an account with
     * one gateway they sat beside "Pay now" doing the identical thing.
     */
    expect(options.body).not.toHaveProperty("provider");
  });
});
