import { describe, expect, it } from "vitest";

import {
  LEGACY_CAPTURE_CANCELLED,
  LEGACY_CAPTURE_CLOSED,
  LEGACY_CAPTURE_PUBLISHED,
  LEGACY_SCRIPT_URL,
  legacyImages,
  readLegacyStart,
  type LegacySmileIdConfig,
} from "@/lib/smile-id/legacy";

/**
 * Smile ID's legacy capture — the parts that decide something.
 *
 * The element itself is theirs and loads from their CDN; what is ours is how a
 * start is read, and what is sent on to the backend.
 */

const config: LegacySmileIdConfig = {
  product: "document_verification",
  job_type: 6,
  capture_document: true,
  document_capture_modes: "camera,upload",
  environment: "sandbox",
  theme_color: "#0f1e3d",
};

describe("reading a start", () => {
  it("captures when the server answers with a legacy config", () => {
    expect(
      readLegacyStart({ attempt_id: "a1", smile_id_legacy: config }),
    ).toEqual({ kind: "capture", attemptId: "a1", config });
  });

  it("leaves it to a person when no vendor is automated", () => {
    expect(readLegacyStart({ attempt_id: "a1", smile_id: null })).toEqual({
      kind: "manual",
      attemptId: "a1",
    });
  });

  it("refuses a V3 answer, which means the integration was switched", () => {
    expect(
      readLegacyStart({ attempt_id: "a1", smile_id: { token: "t" } }),
    ).toEqual({ kind: "changed" });

    // Absent is not null: a server that says nothing has not said "manual".
    expect(readLegacyStart({ attempt_id: "a1" })).toEqual({ kind: "changed" });
  });
});

describe("the images sent on", () => {
  it("keeps the base64 types and normalises their ids", () => {
    expect(
      legacyImages([
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
      legacyImages([
        { image_type_id: 0, image: "/tmp/selfie.jpg" },
        { image_type_id: 1, image: "/tmp/id.jpg" },
        { image_type_id: 2, image: "" },
      ]),
    ).toEqual([]);
  });
});

describe("the SDK", () => {
  it("loads v11 from Smile ID's own CDN", () => {
    expect(LEGACY_SCRIPT_URL).toBe(
      "https://cdn.smileidentity.com/js/v11/smart-camera-web.js",
    );
  });

  it("listens for the events v11 dispatches", () => {
    expect(LEGACY_CAPTURE_PUBLISHED).toBe("smart-camera-web.publish");
    expect(LEGACY_CAPTURE_CANCELLED).toBe("smart-camera-web.cancelled");
    expect(LEGACY_CAPTURE_CLOSED).toBe("smart-camera-web.close");
  });
});
