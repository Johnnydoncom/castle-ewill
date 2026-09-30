import { describe, expect, it } from "vitest";

import { renewHrefFor, willDownloadBlock } from "@/lib/will/download";

/**
 * How the vault says why a Will cannot be downloaded. The reason is the
 * server's; this only words it and points somewhere useful.
 */
describe("downloading a Will from the vault", () => {
  it("offers the download when nothing stands in the way", () => {
    expect(willDownloadBlock("w1", null)).toBeNull();
    expect(willDownloadBlock("w1", undefined)).toBeNull();
  });

  it("sends a lapsed subscription to that Will's renewal", () => {
    expect(willDownloadBlock("w1", "subscription_required")).toEqual({
      message:
        "This Will's subscription has ended, so downloading it is paused. Renew to download it again — nothing has been deleted.",
      cta: { label: "Renew subscription", href: "/dashboard/wills/w1#subscription" },
    });
  });

  it("sends an unconfirmed identity to the identity check, and the rest to the Will", () => {
    expect(willDownloadBlock("w1", "kyc_required")?.cta.href).toBe("/dashboard/kyc");
    expect(willDownloadBlock("w1", "unpaid")?.cta.href).toBe("/dashboard/wills/w1");
    expect(willDownloadBlock("w1", "witnesses_required")?.cta.href).toBe("/dashboard/wills/w1");
  });

  it("words it for a lawyer about their client's Will", () => {
    // The Will, the photograph and the witnesses are the client's; the
    // identity owed is still the lawyer's own, and goes to the same place.
    expect(willDownloadBlock("w1", "passport_photograph_required", true)?.message).toBe(
      "Add your client's passport photograph — it is printed on their Will.",
    );
    expect(willDownloadBlock("w1", "incomplete", true)).toEqual({
      message: "Finish this Will to download it.",
      cta: { label: "Continue this Will", href: "/dashboard/wills/w1" },
    });
    expect(willDownloadBlock("w1", "witnesses_required", true)?.message).not.toContain("Your");
    expect(willDownloadBlock("w1", "kyc_required", true)?.cta.href).toBe("/dashboard/kyc");

    // And unchanged for everybody else.
    expect(willDownloadBlock("w1", "incomplete")?.message).toBe(
      "Finish your Will to download it.",
    );
  });

  it("renews a document's subscription on its Will, or on the billing page when it has none", () => {
    expect(renewHrefFor("w1")).toBe("/dashboard/wills/w1#subscription");
    expect(renewHrefFor(null)).toBe("/dashboard/payments");
  });
});
