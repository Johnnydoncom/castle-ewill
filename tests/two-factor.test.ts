import { beforeEach, describe, expect, it, vi } from "vitest";

import { beginTwoFactorSetupAction } from "@/lib/actions/two-factor";

/**
 * Starting two-factor setup. The QR code is drawn by our own API; this tier
 * only passes it on, and only as an inline PNG.
 */

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browser", () => ({ api, apiMutation: vi.fn() }));

beforeEach(() => {
  api.mockReset();
});

function answer(qr: unknown) {
  return {
    ok: true,
    data: {
      message: "Scan the QR code.",
      data: { secret: "JBSWY3DPEHPK3PXP", formatted: "JBSW Y3DP EHPK 3PXP", uri: "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP", qr },
    },
  };
}

describe("starting two-factor setup", () => {
  it("passes on the QR code the server drew", async () => {
    api.mockResolvedValue(answer("data:image/png;base64,iVBORw0KGgo="));

    expect(await beginTwoFactorSetupAction()).toMatchObject({
      status: "success",
      formatted: "JBSW Y3DP EHPK 3PXP",
      qr: "data:image/png;base64,iVBORw0KGgo=",
    });
  });

  it("uses nothing but an inline PNG as the code", async () => {
    // A remote image would mean the secret had been sent somewhere to be drawn.
    for (const qr of ["https://images.example.com/qr?data=otpauth", "data:image/svg+xml;base64,PHN2Zz4=", null, undefined]) {
      api.mockResolvedValue(answer(qr));

      expect(await beginTwoFactorSetupAction()).toMatchObject({ status: "success", qr: null });
    }
  });

  it("passes a refusal back to the screen", async () => {
    api.mockResolvedValue({ ok: false, message: "Two-factor authentication is already switched on." });

    expect(await beginTwoFactorSetupAction()).toEqual({
      status: "error",
      message: "Two-factor authentication is already switched on.",
    });
  });
});
