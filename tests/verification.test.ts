import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  startVerificationAction,
  submitVerificationAction,
} from "@/lib/actions/verification.client";

/**
 * The wire contract between the Smile ID Web SDK and Laravel.
 *
 * This tier does not judge a verification — it forwards one. So what is worth
 * asserting is exactly that: the payload the component published arrives
 * unaltered, with the tags that say which image is which, and nothing this
 * module invented along the way. Everything else about the check happens on the
 * other side of this call.
 */

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/browser", () => ({ api }));

/** One image as `smart-camera-web.publish` hands it over. */
const SELFIE = { image: "c2VsZmll", image_type_id: 2 };
const LIVENESS = { image: "bGl2ZW5lc3M=", image_type_id: 6 };
const ID_FRONT = { image: "aWQtZnJvbnQ=", image_type_id: 3 };

beforeEach(() => {
  api.mockReset();
});

describe("starting an attempt", () => {
  it("asks the server how the SDK should be configured", async () => {
    api.mockResolvedValue({
      ok: true,
      data: {
        data: {
          attempt_id: "attempt-1",
          capture: {
            document: true,
            document_type: "NATIONAL_ID",
            partner_name: "Castle eWill and Trust Limited",
            policy_url: "https://castlewilltrust.com/privacy",
          },
        },
      },
    });

    const result = await startVerificationAction("national_id");

    expect(result.status).toBe("success");

    // Whether a document is photographed at all is the server's decision — it
    // follows from whether this is a first verification or a recheck, and the
    // browser is told, not asked.
    if (result.status === "success") {
      expect(result.capture.document).toBe(true);
      expect(result.capture.document_type).toBe("NATIONAL_ID");
    }

    expect(api).toHaveBeenCalledWith("/verification/start", {
      method: "POST",
      body: { document_type: "national_id" },
    });
  });

  it("surfaces a refusal rather than pretending it started", async () => {
    api.mockResolvedValue({ ok: false, message: "Too many attempts." });

    const result = await startVerificationAction();

    expect(result).toEqual({ status: "error", message: "Too many attempts." });
  });
});

describe("submitting what was captured", () => {
  it("forwards the published images untouched, tags and all", async () => {
    api.mockResolvedValue({ ok: true, data: { message: "Recorded." } });

    await submitVerificationAction({
      attemptId: "attempt-1",
      images: [SELFIE, LIVENESS, ID_FRONT],
      libraryVersion: "11.6.2",
      documentType: "national_id",
    });

    /*
     * `image_type_id` is the only thing that says which frame is the selfie and
     * which the document — the list is otherwise homogeneous. Re-encoding these
     * into file parts, as the previous multipart flow did, would throw that
     * away.
     */
    expect(api).toHaveBeenCalledWith("/verification/submit", {
      method: "POST",
      body: {
        attempt_id: "attempt-1",
        images: [SELFIE, LIVENESS, ID_FRONT],
        library_version: "11.6.2",
        document_type: "national_id",
      },
    });
  });

  it("refuses an empty capture without calling the server", async () => {
    const result = await submitVerificationAction({
      attemptId: "attempt-1",
      images: [],
    });

    expect(result.status).toBe("error");
    expect(api).not.toHaveBeenCalled();
  });

  it("does not decide for itself whether a capture is complete", async () => {
    api.mockResolvedValue({ ok: true, data: { message: "Recorded." } });

    // One frame and no document. The server decides whether that is enough —
    // a browser that withheld it would turn a precise "the camera did not
    // capture enough of the check" into a generic refusal.
    await submitVerificationAction({
      attemptId: "attempt-1",
      images: [SELFIE],
    });

    expect(api).toHaveBeenCalledOnce();
  });

  it("passes a server refusal back to the client screen", async () => {
    api.mockResolvedValue({
      ok: false,
      message: "Your identity document was not captured.",
    });

    const result = await submitVerificationAction({
      attemptId: "attempt-1",
      images: [SELFIE],
    });

    expect(result).toMatchObject({
      status: "error",
      message: "Your identity document was not captured.",
    });
  });
});
