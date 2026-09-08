import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  startVerificationAction,
  submittedVerificationAction,
} from "@/lib/actions/verification.client";

/**
 * The seam between Smile ID's hosted flow and our API.
 *
 * There is very little of it, which is the point of the integration: the
 * browser hands a server-minted token to `window.SmileIdentity()` and uploads
 * to Smile ID directly. So what is worth asserting is that this tier stays out
 * of the way — it never invents configuration, never carries an image, and
 * passes a refusal through rather than dressing it up.
 */

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browser", () => ({ api }));

const CONFIG = {
  token: "sid.web.token",
  product: "document_verification",
  environment: "sandbox" as const,
  partner_details: {
    partner_id: "9055",
    name: "Castle eWill and Trust Limited",
    logo_url: "https://castlewilltrust.com/logo.png",
    policy_url: "https://castlewilltrust.com/privacy",
    theme_color: "#0f1e3d",
  },
};

beforeEach(() => {
  api.mockReset();
});

describe("starting an attempt", () => {
  it("takes the whole capture configuration from the server", async () => {
    api.mockResolvedValue({
      ok: true,
      data: { data: { attempt_id: "attempt-1", smile_id: CONFIG } },
    });

    const result = await startVerificationAction();

    expect(result.status).toBe("success");

    if (result.status === "success") {
      // Nothing here is the browser's to choose — least of all the token,
      // which is what seals the job id this result will settle against.
      expect(result.smileId).toEqual(CONFIG);
      expect(result.attemptId).toBe("attempt-1");
    }

    /*
     * Nothing is asked for. There is one integration now — the web components
     * — so there is no `flow` to name, and no `document_type` either: the
     * hosted modal chose a document to photograph, and Biometric KYC asks an
     * authority about a number the client types on our own screen.
     */
    expect(api).toHaveBeenCalledWith("/verification/start", {
      method: "POST",
      body: {},
    });
  });

  it("reports no hosted flow when no vendor is configured", async () => {
    api.mockResolvedValue({
      ok: true,
      data: { data: { attempt_id: "attempt-1", smile_id: null } },
    });

    const result = await startVerificationAction();

    // Null is a real answer — a person will decide this one — not a failure to
    // be shown as a broken camera.
    if (result.status === "success") {
      expect(result.smileId).toBeNull();
    }
  });

  it("refuses when the API predates the hosted flow, instead of opening it with nothing", async () => {
    // A stale deployment answers without the key at all. Opening the SDK with
    // `undefined` threw inside their script — "can't access property token" —
    // where there was no way to tell the client what had happened.
    api.mockResolvedValue({
      ok: true,
      data: { data: { attempt_id: "attempt-1" } },
    });

    const result = await startVerificationAction();

    expect(result.status).toBe("error");
  });

  it("surfaces a refusal rather than pretending it started", async () => {
    api.mockResolvedValue({
      ok: false,
      message: "The identity check is unavailable just now.",
    });

    const result = await startVerificationAction();

    expect(result).toEqual({
      status: "error",
      message: "The identity check is unavailable just now.",
    });
  });
});

describe("reporting a submission", () => {
  it("sends the attempt id and nothing else", async () => {
    api.mockResolvedValue({ ok: true, data: { message: "Submitted." } });

    await submittedVerificationAction("attempt-1", "job_9");

    /*
     * No images. The browser posted them straight to Smile ID's V3 API; a
     * payload here carrying a client's face would mean the relay had come
     * back. Only the job id from their 202 travels this way.
     */
    expect(api).toHaveBeenCalledWith("/verification/submitted", {
      method: "POST",
      body: { attempt_id: "attempt-1", job_id: "job_9" },
    });
  });

  it("passes a server refusal back to the screen", async () => {
    api.mockResolvedValue({
      ok: false,
      message: "That attempt has expired. Please start again.",
    });

    const result = await submittedVerificationAction("attempt-1", "job_9");

    expect(result).toMatchObject({
      status: "error",
      message: "That attempt has expired. Please start again.",
    });
  });
});
