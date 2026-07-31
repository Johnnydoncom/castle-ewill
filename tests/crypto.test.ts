import { describe, expect, it } from "vitest";

import { decryptBuffer, encryptBuffer, sha256 } from "@/lib/security/crypto";
import { rateLimit, resetRateLimit, sweepRateLimits } from "@/lib/auth/rate-limit";

describe("vault encryption", () => {
  it("round-trips a document", () => {
    const plaintext = Buffer.from("Passport scan bytes — sensitive.", "utf8");
    const restored = decryptBuffer(encryptBuffer(plaintext));
    expect(restored.equals(plaintext)).toBe(true);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const plaintext = Buffer.from("same input");
    expect(encryptBuffer(plaintext).equals(encryptBuffer(plaintext))).toBe(false);
  });

  it("detects tampering via the GCM auth tag", () => {
    const envelope = encryptBuffer(Buffer.from("original contents"));
    envelope[envelope.length - 1] ^= 0xff;
    expect(() => decryptBuffer(envelope)).toThrow();
  });

  it("rejects a truncated envelope instead of misreading it", () => {
    expect(() => decryptBuffer(Buffer.alloc(8))).toThrow(/too short/i);
  });

  it("hashes deterministically", () => {
    expect(sha256("castle")).toBe(sha256(Buffer.from("castle")));
  });
});

describe("rate limiting", () => {
  it("allows up to the limit then blocks", () => {
    resetRateLimit("test:key");
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("test:key", 3, 60).ok).toBe(true);
    }
    const blocked = rateLimit("test:key", 3, 60);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keys independently", () => {
    resetRateLimit("a");
    resetRateLimit("b");
    rateLimit("a", 1, 60);
    expect(rateLimit("a", 1, 60).ok).toBe(false);
    expect(rateLimit("b", 1, 60).ok).toBe(true);
  });

  it("sweeps expired windows so the map cannot grow unbounded", () => {
    resetRateLimit("sweep");
    rateLimit("sweep", 1, 1);
    expect(sweepRateLimits(Date.now() + 5_000)).toBeGreaterThan(0);
    expect(rateLimit("sweep", 1, 60).ok).toBe(true);
  });
});
