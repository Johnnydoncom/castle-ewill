import { describe, expect, it } from "vitest";

import {
  base32Decode,
  base32Encode,
  buildOtpAuthUri,
  formatSecretForDisplay,
  generateTotp,
  generateTotpSecret,
  hotp,
  verifyTotp,
} from "@/lib/auth/totp";

/** RFC 6238 Appendix B seed for the SHA-1 vectors. */
const RFC_SECRET = Buffer.from("12345678901234567890", "ascii");
const RFC_SECRET_B32 = base32Encode(RFC_SECRET);

describe("RFC 6238 test vectors", () => {
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ])("matches the published value at T=%i", (time, expected) => {
    expect(
      hotp(RFC_SECRET, Math.floor(time / 30), {
        digits: 8,
        algorithm: "sha1",
      }),
    ).toBe(expected);
  });
});

describe("base32", () => {
  it("round-trips", () => {
    expect(base32Decode(RFC_SECRET_B32).equals(RFC_SECRET)).toBe(true);
  });

  it("tolerates the lowercase, spaced form apps display", () => {
    const messy = RFC_SECRET_B32.toLowerCase().replace(/(.{4})/g, "$1 ");
    expect(base32Decode(messy).equals(RFC_SECRET)).toBe(true);
  });

  it("tolerates padding", () => {
    expect(base32Decode(`${RFC_SECRET_B32}======`).equals(RFC_SECRET)).toBe(
      true,
    );
  });

  it("rejects an invalid character", () => {
    expect(() => base32Decode("ABC1")).toThrow(/invalid base32/i);
  });
});

describe("verification", () => {
  const now = 1_700_000_000_000;

  it("accepts the current code", () => {
    const code = generateTotp(RFC_SECRET_B32, now);
    expect(verifyTotp(RFC_SECRET_B32, code, { atMs: now })).toBe(true);
  });

  it("tolerates one step of clock drift in each direction", () => {
    const code = generateTotp(RFC_SECRET_B32, now);
    expect(verifyTotp(RFC_SECRET_B32, code, { atMs: now + 30_000 })).toBe(true);
    expect(verifyTotp(RFC_SECRET_B32, code, { atMs: now - 30_000 })).toBe(true);
  });

  it("rejects a code that has expired beyond the window", () => {
    const code = generateTotp(RFC_SECRET_B32, now);
    expect(verifyTotp(RFC_SECRET_B32, code, { atMs: now + 120_000 })).toBe(
      false,
    );
  });

  it("rejects wrong and malformed codes", () => {
    expect(verifyTotp(RFC_SECRET_B32, "000000", { atMs: now })).toBe(false);
    expect(verifyTotp(RFC_SECRET_B32, "12345", { atMs: now })).toBe(false);
    expect(verifyTotp(RFC_SECRET_B32, "abcdef", { atMs: now })).toBe(false);
    expect(verifyTotp(RFC_SECRET_B32, "", { atMs: now })).toBe(false);
  });

  it("accepts a code entered with a space, as apps display it", () => {
    const code = generateTotp(RFC_SECRET_B32, now);
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
    expect(verifyTotp(RFC_SECRET_B32, spaced, { atMs: now })).toBe(true);
  });
});

describe("secrets and provisioning", () => {
  it("generates distinct 160-bit secrets", () => {
    const secrets = new Set(Array.from({ length: 200 }, generateTotpSecret));
    expect(secrets.size).toBe(200);
    for (const secret of secrets) {
      expect(base32Decode(secret).length).toBe(20);
    }
  });

  it("builds an otpauth URI an authenticator can consume", () => {
    const uri = buildOtpAuthUri({
      secretBase32: RFC_SECRET_B32,
      accountName: "ada@example.com",
      issuer: "Castle eWill & Trust",
    });
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain(`secret=${RFC_SECRET_B32}`);
    expect(uri).toContain("period=30");
    // The label must be encoded — an unescaped & would truncate the query.
    expect(uri).toContain("Castle%20eWill%20%26%20Trust%3Aada%40example.com");
  });

  it("groups the secret for manual entry", () => {
    expect(formatSecretForDisplay("ABCDEFGH")).toBe("ABCD EFGH");
  });
});
