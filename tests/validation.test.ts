import { describe, expect, it } from "vitest";

import {
  ageFromDateOfBirth,
  beneficiariesSchema,
  conflictingWitnesses,
  dateOfBirthSchema,
  executorsSchema,
  guardianshipSchema,
  phoneSchema,
  sharesTotal,
  witnessesSchema,
} from "@/lib/will/validation";

const beneficiary = (fullName: string, sharePercent: number, isContingent = false) => ({
  fullName,
  relationship: "Child",
  sharePercent,
  isContingent,
});

describe("shares", () => {
  it("totals in basis points so decimal shares do not drift", () => {
    // A real drifting split: naive float addition yields 100.00000000000001,
    // which would fail a strict `=== 100` check. Basis points make it exact.
    expect(28.1 + 35.95 + 35.95).not.toBe(100);
    expect(sharesTotal([28.1, 35.95, 35.95])).toBe(10_000);
    expect(sharesTotal([33.33, 33.33, 33.34])).toBe(10_000);
  });

  it("accepts beneficiary shares totalling exactly 100%", () => {
    expect(
      beneficiariesSchema.safeParse({
        beneficiaries: [beneficiary("Ada", 60), beneficiary("Kene", 40)],
      }).success,
    ).toBe(true);

    // The split that drifts under float addition must still be accepted.
    expect(
      beneficiariesSchema.safeParse({
        beneficiaries: [
          beneficiary("Ada", 28.1),
          beneficiary("Kene", 35.95),
          beneficiary("Zara", 35.95),
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects shares that do not total 100%", () => {
    const result = beneficiariesSchema.safeParse({
      beneficiaries: [beneficiary("Ada", 60), beneficiary("Kene", 30)],
    });
    expect(result.success).toBe(false);
  });

  it("excludes contingent beneficiaries from the 100% rule", () => {
    const result = beneficiariesSchema.safeParse({
      beneficiaries: [
        beneficiary("Ada", 100),
        beneficiary("Backup", 0, true),
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("date of birth", () => {
  it("computes age across a birthday that has not yet occurred", () => {
    expect(ageFromDateOfBirth("1990-12-31", new Date("2026-06-01T00:00:00Z"))).toBe(35);
    expect(ageFromDateOfBirth("1990-01-01", new Date("2026-06-01T00:00:00Z"))).toBe(36);
  });

  it("rejects a testator under eighteen", () => {
    const recent = new Date();
    recent.setUTCFullYear(recent.getUTCFullYear() - 10);
    expect(dateOfBirthSchema.safeParse(recent.toISOString().slice(0, 10)).success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(dateOfBirthSchema.safeParse("31/12/1990").success).toBe(false);
    expect(dateOfBirthSchema.safeParse("1990-13-45").success).toBe(false);
  });
});

describe("phone numbers", () => {
  it.each(["08111115547", "+2348111115547", "0810 111 5547", "07011115547"])(
    "accepts %s",
    (value) => expect(phoneSchema.safeParse(value).success).toBe(true),
  );

  it.each(["12345", "0611111554", "+1 415 555 0100"])(
    "rejects %s",
    (value) => expect(phoneSchema.safeParse(value).success).toBe(false),
  );
});

describe("witness independence", () => {
  it("flags a witness who is also a beneficiary, ignoring case and spacing", () => {
    expect(
      conflictingWitnesses(["Ada  Okafor", "Kene Okafor"], ["ada okafor", "Tunde Bello"]),
    ).toEqual(["ada okafor"]);
  });

  it("passes when witnesses are independent", () => {
    expect(conflictingWitnesses(["Ada Okafor"], ["Tunde Bello", "Ngozi Eze"])).toEqual([]);
  });

  it("requires exactly two witnesses", () => {
    const witness = { fullName: "Tunde Bello", address: "12 Bourdillon Rd, Ikoyi" };
    expect(witnessesSchema.safeParse({ witnesses: [witness] }).success).toBe(false);
    expect(witnessesSchema.safeParse({ witnesses: [witness, witness] }).success).toBe(true);
  });
});

describe("executors and guardians", () => {
  it("requires at least one primary executor", () => {
    const alternate = {
      fullName: "Tunde Bello",
      address: "12 Bourdillon Rd",
      isAlternate: true,
    };
    expect(executorsSchema.safeParse({ executors: [alternate] }).success).toBe(false);
    expect(
      executorsSchema.safeParse({
        executors: [{ ...alternate, isAlternate: false }],
      }).success,
    ).toBe(true);
  });

  it("requires a guardian only when there are minor children", () => {
    expect(
      guardianshipSchema.safeParse({ hasMinorChildren: false, guardians: [] }).success,
    ).toBe(true);
    expect(
      guardianshipSchema.safeParse({ hasMinorChildren: true, guardians: [] }).success,
    ).toBe(false);
  });
});
