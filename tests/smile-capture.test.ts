import { describe, expect, it } from "vitest";

import {
  CAPTURE_CANCELLED,
  CAPTURE_CLOSED,
  CAPTURE_PUBLISHED,
  SANDBOX_TEST_NUMBERS,
  SMILE_ID_SCRIPT_URL,
  imagesForSubmission,
  readStart,
  type SmileIdCaptureConfig,
} from "@/lib/smile-id/capture";

/**
 * Smile ID's capture — the parts that decide something.
 *
 * The element itself is theirs and loads from their CDN; what is ours is how a
 * start is read, and what is sent on to the backend.
 */

const config: SmileIdCaptureConfig = {
  product: "document_verification",
  job_type: 6,
  capture_document: true,
  document_capture_modes: "camera,upload",
  environment: "sandbox",
  theme_color: "#0f1e3d",
};

describe("reading a start", () => {
  it("captures when the server answers with a capture config", () => {
    expect(readStart({ attempt_id: "a1", smile_id: config })).toEqual({
      kind: "capture",
      attemptId: "a1",
      config,
    });
  });

  it("still reads the key the API answered under while two integrations existed", () => {
    // So a frontend deploy landing before the backend's does not break a check.
    expect(readStart({ attempt_id: "a1", smile_id_legacy: config })).toEqual({
      kind: "capture",
      attemptId: "a1",
      config,
    });
  });

  it("reads a Biometric KYC config, with the number it asks for", () => {
    const biometric: SmileIdCaptureConfig = {
      ...config,
      product: "biometric_kyc",
      job_type: 1,
      capture_document: false,
      id_number_required: true,
      id_types: [
        { code: "NIN_V2", label: "National Identification Number (NIN)", pattern: "^[0-9]{11}$" },
      ],
      prefill: { id_number: null, dob: null },
    };

    expect(readStart({ attempt_id: "a1", smile_id: biometric })).toEqual({
      kind: "capture",
      attemptId: "a1",
      config: biometric,
    });
  });

  it("leaves it to a person when no vendor is automated", () => {
    expect(readStart({ attempt_id: "a1", smile_id: null })).toEqual({
      kind: "manual",
      attemptId: "a1",
    });
  });

  it("refuses an answer it was not written for", () => {
    // A V3 web-component config: a token and no job type.
    expect(readStart({ attempt_id: "a1", smile_id: { token: "t" } })).toEqual({
      kind: "unavailable",
    });

    // Absent is not null: a server that says nothing has not said "manual".
    expect(readStart({ attempt_id: "a1" })).toEqual({ kind: "unavailable" });
  });
});

describe("the images sent on", () => {
  it("keeps the base64 types and normalises their ids", () => {
    expect(
      imagesForSubmission([
        { image_type_id: "2", image: "selfie" },
        { image_type_id: 6, image: "liveness" },
        { image_type_id: 3, image: "front" },
        { image_type_id: 7, image: "back" },
      ]),
    ).toEqual([
      { image_type_id: 2, image: "selfie" },
      { image_type_id: 6, image: "liveness" },
      { image_type_id: 3, image: "front" },
      { image_type_id: 7, image: "back" },
    ]);
  });

  it("drops file-path types and empty frames", () => {
    expect(
      imagesForSubmission([
        { image_type_id: 0, image: "/tmp/selfie.jpg" },
        { image_type_id: 1, image: "/tmp/id.jpg" },
        { image_type_id: 2, image: "" },
      ]),
    ).toEqual([]);
  });
});

describe("the sandbox test numbers", () => {
  it("are Smile ID's, and only the one ending in 4 can match a real selfie", () => {
    expect(SANDBOX_TEST_NUMBERS.matchesYourSelfie).toBe("00000000004");
    expect(SANDBOX_TEST_NUMBERS.notFound).toBe("00000000001");
    expect(new RegExp("^[0-9]{11}$").test(SANDBOX_TEST_NUMBERS.matchesYourSelfie)).toBe(true);
  });
});

describe("the SDK", () => {
  it("loads v11 from Smile ID's own CDN", () => {
    expect(SMILE_ID_SCRIPT_URL).toBe(
      "https://cdn.smileidentity.com/js/v11/smart-camera-web.js",
    );
  });

  it("listens for the events v11 dispatches", () => {
    expect(CAPTURE_PUBLISHED).toBe("smart-camera-web.publish");
    expect(CAPTURE_CANCELLED).toBe("smart-camera-web.cancelled");
    expect(CAPTURE_CLOSED).toBe("smart-camera-web.close");
  });
});
