import { describe, expect, it } from "vitest";

import { collectRows, mapFieldErrors } from "@/lib/will/rows";

/**
 * How the wizard's rows reach the API.
 *
 * A row that collects wrongly saves nothing while reporting success, so these
 * are cheap to assert and expensive to notice in production.
 */
describe("collecting rows", () => {
  it("nests a guardian inside the beneficiary it belongs to", () => {
    const form = new FormData();
    form.append("beneficiaries.0.id", "0198f0c2-0000-7000-8000-000000000001");
    form.append("beneficiaries.0.firstName", "Zara");
    form.append("beneficiaries.0.isMinor", "on");
    form.append("beneficiaries.0.guardian.firstName", "Chidi");
    form.append("beneficiaries.0.guardian.address", "9 Broad Street");
    form.append("beneficiaries.1.firstName", "Kene");

    expect(collectRows(form, "beneficiaries")).toEqual([
      {
        id: "0198f0c2-0000-7000-8000-000000000001",
        first_name: "Zara",
        is_minor: true,
        guardian: { first_name: "Chidi", address: "9 Broad Street" },
      },
      { first_name: "Kene" },
    ]);
  });

  it("keeps rows in index order when a middle one was removed", () => {
    const form = new FormData();
    form.append("executors.3.firstName", "Third");
    form.append("executors.0.firstName", "First");

    expect(collectRows(form, "executors").map((row) => row.first_name)).toEqual([
      "First",
      "Third",
    ]);
  });

  it("does not collect another collection that shares a prefix", () => {
    const form = new FormData();
    form.append("shares.0.beneficiaryId", "abc");
    form.append("sharesExtra.0.beneficiaryId", "nope");

    expect(collectRows(form, "shares")).toEqual([{ beneficiary_id: "abc" }]);
  });
});

describe("mapping errors back onto fields", () => {
  it("points a nested error at the input that caused it", () => {
    expect(
      mapFieldErrors({
        "beneficiaries.0.guardian.first_name": ["Give the guardian's first name."],
        national_id: ["Your National Identification Number is required."],
      }),
    ).toEqual({
      "beneficiaries.0.guardian.firstName": ["Give the guardian's first name."],
      nationalId: ["Your National Identification Number is required."],
    });
  });
});
