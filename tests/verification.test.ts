import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  startVerificationAction,
  submitCaptureAction,
  submittedVerificationAction,
} from "@/lib/actions/verification.client";

/**
 * The seam between Smile ID's capture and our API.
 *
 * What is worth asserting is that this tier stays out of the way: it never
 * invents configuration, sends only the images Smile ID takes, and passes a
 * refusal through rather than dressing it up.
 */

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browser", () => ({ api }));

const CONFIG = {
  product: "smart_selfie_registration",
  job_type: 4,
  capture_document: false,
  document_capture_modes: "camera,upload",
  environment: "sandbox" as const,
  theme_color: "#0f1e3d",
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

    expect(result).toEqual({ status: "success", attemptId: "attempt-1", config: CONFIG });

    // Nothing is asked for: which product runs is the server's decision.
    expect(api).toHaveBeenCalledWith("/verification/start", {
      method: "POST",
      body: {},
    });
  });

  it("reports no capture when no vendor is configured", async () => {
    api.mockResolvedValue({
      ok: true,
      data: { data: { attempt_id: "attempt-1", smile_id: null } },
    });

    // Null is a real answer — a person will decide this one — not a failure to
    // be shown as a broken camera.
    expect(await startVerificationAction()).toEqual({
      status: "success",
      attemptId: "attempt-1",
      config: null,
    });
  });

  it("refuses an answer with no capture in it, instead of opening a camera with nothing", async () => {
    api.mockResolvedValue({
      ok: true,
      data: { data: { attempt_id: "attempt-1" } },
    });

    expect((await startVerificationAction()).status).toBe("error");
  });

  it("surfaces a refusal rather than pretending it started", async () => {
    api.mockResolvedValue({
      ok: false,
      message: "The identity check is unavailable just now.",
    });

    expect(await startVerificationAction()).toEqual({
      status: "error",
      message: "The identity check is unavailable just now.",
    });
  });
});

describe("sending a capture", () => {
  it("sends the attempt and the images Smile ID takes, and nothing else", async () => {
    api.mockResolvedValue({ ok: true, data: { message: "Submitted." } });

    await submitCaptureAction("attempt-1", [
      { image_type_id: "2", image: "selfie" },
      { image_type_id: 0, image: "/etc/passwd" },
    ]);

    expect(api).toHaveBeenCalledWith("/verification/legacy/submit", {
      method: "POST",
      body: {
        attempt_id: "attempt-1",
        images: [{ image_type_id: 2, image: "selfie" }],
      },
    });
  });

  it("passes the server's refusal back to the screen", async () => {
    api.mockResolvedValue({
      ok: false,
      message: "The identity check could not be started. Please try again, or contact us if this keeps happening.",
    });

    expect(await submitCaptureAction("attempt-1", [{ image_type_id: 2, image: "s" }])).toEqual({
      status: "error",
      message: "The identity check could not be started. Please try again, or contact us if this keeps happening.",
    });
  });
});

describe("recording a manual attempt", () => {
  it("sends the attempt id and nothing else", async () => {
    api.mockResolvedValue({ ok: true, data: { message: "Submitted." } });

    await submittedVerificationAction("attempt-1", null);

    expect(api).toHaveBeenCalledWith("/verification/submitted", {
      method: "POST",
      body: { attempt_id: "attempt-1", job_id: null },
    });
  });

  it("passes a server refusal back to the screen", async () => {
    api.mockResolvedValue({
      ok: false,
      message: "That attempt has expired. Please start again.",
    });

    expect(await submittedVerificationAction("attempt-1", null)).toMatchObject({
      status: "error",
      message: "That attempt has expired. Please start again.",
    });
  });
});
