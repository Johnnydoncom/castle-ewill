import { describe, expect, it } from "vitest";

import { VIDEO_ACCEPT_ATTRIBUTE, describeFileProblem } from "@/lib/documents";

const MB = 1024 * 1024;
const NOT_A_RECORDING = "Only MP4, MOV and WebM recordings are accepted.";
const NOT_A_DOCUMENT = "Only PDF, JPG, PNG, WEBP and HEIC files are accepted.";

/**
 * The browser's check before an upload, by kind.
 *
 * Reported 2026-09-14: a Platinum client's MP4 recording was refused as "Only
 * PDF, JPG, PNG, WEBP and HEIC files are accepted", because every upload was
 * checked against the document formats.
 */
describe("checking a file before it is uploaded", () => {
  it("accepts a Will recording as a video", () => {
    // The reported file.
    expect(describeFileProblem("bandicam 2026-06-05 22-11-14-539.mp4", "video/mp4", 8 * MB, "will_video")).toBeNull();
    expect(describeFileProblem("reading.mov", "video/quicktime", 20 * MB, "will_video")).toBeNull();
    expect(describeFileProblem("reading.webm", "video/webm", 5 * MB, "will_video")).toBeNull();
    // Some browsers give a video no type at all: its extension decides, and the server reads the real type.
    expect(describeFileProblem("reading.mov", "", 5 * MB, "will_video")).toBeNull();
  });

  it("refuses anything but MP4, MOV or WebM for a recording", () => {
    expect(describeFileProblem("will.pdf", "application/pdf", MB, "will_video")).toBe(NOT_A_RECORDING);
    expect(describeFileProblem("clip.avi", "video/x-msvideo", MB, "will_video")).toBe(NOT_A_RECORDING);
    // A name that says video and a declared type that says otherwise.
    expect(describeFileProblem("clip.mp4", "application/x-msdownload", MB, "will_video")).toBe(NOT_A_RECORDING);
    expect(describeFileProblem("clip.mp4", "video/quicktime", MB, "will_video")).toBe(NOT_A_RECORDING);
  });

  it("holds a recording to the video ceiling, and a document to the document one", () => {
    expect(describeFileProblem("reading.mp4", "video/mp4", 59 * MB, "will_video")).toBeNull();
    expect(describeFileProblem("reading.mp4", "video/mp4", 61 * MB, "will_video")).toBe(
      "That file is 61.0 MB. The limit is 60 MB.",
    );
    expect(describeFileProblem("scan.pdf", "application/pdf", 11 * MB, "identity_document")).toBe(
      "That file is 11.0 MB. The limit is 10 MB.",
    );
  });

  it("still checks every other upload against the document formats", () => {
    expect(describeFileProblem("passport.jpg", "image/jpeg", MB, "identity_document")).toBeNull();
    // The vault's own check names no kind, and is unchanged.
    expect(describeFileProblem("passport.jpg", "image/jpeg", MB)).toBeNull();
    // A video is not an identity document.
    expect(describeFileProblem("reading.mp4", "video/mp4", MB, "identity_document")).toBe(NOT_A_DOCUMENT);
    expect(describeFileProblem("reading.mp4", "video/mp4", MB)).toBe(NOT_A_DOCUMENT);
  });

  it("offers the recording picker the video types and their extensions", () => {
    expect(VIDEO_ACCEPT_ATTRIBUTE.split(",")).toEqual(
      expect.arrayContaining(["video/mp4", "video/quicktime", "video/webm", ".mp4", ".mov", ".webm"]),
    );
  });
});
