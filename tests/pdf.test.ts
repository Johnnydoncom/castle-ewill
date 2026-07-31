import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

import { generateWillPdf, willFileName } from "@/lib/will/pdf";
import type { FullWill } from "@/lib/will/repository";

function buildWill(overrides: Partial<FullWill> = {}): FullWill {
  const now = new Date("2026-07-30T00:00:00Z");

  return {
    id: "will-1",
    userId: "user-1",
    reference: "CW-2026-4F3A9C",
    title: "Last Will of Ada Okafor",
    status: "draft",
    version: 1,
    currentStep: 9,
    completionPercent: 100,
    fullLegalName: "Ada Chinelo Okafor",
    dateOfBirth: "1985-04-02",
    nationality: "Nigerian",
    maritalStatus: "married",
    occupation: "Architect",
    nationalId: "12345678901",
    addressLine1: "12 Bourdillon Road",
    addressLine2: null,
    city: "Ikoyi",
    state: "Lagos",
    declaredLastWill: true,
    revokesPriorWills: true,
    confirmedSoundMind: true,
    hasMinorChildren: true,
    funeralPreference: "burial",
    funeralInstructions: "A simple service in Awka, close family only.",
    residuaryEstate: null,
    specialInstructions: null,
    confirmedAccurate: true,
    submittedAt: null,
    approvedAt: null,
    lastGeneratedAt: null,
    createdAt: now,
    updatedAt: now,
    executors: [
      {
        id: "e1", willId: "will-1", sortOrder: 0, isAlternate: false,
        fullName: "Emeka Okafor", relationship: "Spouse",
        email: null, phone: null, address: "12 Bourdillon Road, Ikoyi, Lagos",
        createdAt: now,
      },
      {
        id: "e2", willId: "will-1", sortOrder: 1, isAlternate: true,
        fullName: "Barr. T. Adeyemi", relationship: "Solicitor",
        email: null, phone: null, address: "4 Kingsway Road, Ikoyi, Lagos",
        createdAt: now,
      },
    ],
    beneficiaries: [
      {
        id: "b1", willId: "will-1", sortOrder: 0, fullName: "Emeka Okafor",
        relationship: "Spouse", email: null, phone: null, address: null,
        sharePercent: "60.00", isContingent: false, notes: null, createdAt: now,
      },
      {
        id: "b2", willId: "will-1", sortOrder: 1, fullName: "Zara Okafor",
        relationship: "Daughter", email: null, phone: null, address: null,
        sharePercent: "40.00", isContingent: false, notes: null, createdAt: now,
      },
    ],
    guardians: [
      {
        id: "g1", willId: "will-1", sortOrder: 0, isAlternate: false,
        fullName: "Chidi Nwosu", relationship: "Brother", phone: null,
        address: "9 Awolowo Road, Ikoyi, Lagos", childrenCovered: "Zara Okafor",
        createdAt: now,
      },
    ],
    bequests: [
      {
        id: "q1", willId: "will-1", sortOrder: 0,
        itemDescription: "My father's wristwatch", recipientName: "Kene Okafor",
        recipientRelationship: "Son", notes: null, createdAt: now,
      },
    ],
    assets: [
      {
        id: "a1", willId: "will-1", sortOrder: 0, type: "real_estate",
        description: "Residential property at 12 Bourdillon Road",
        institution: null, identifier: "LAG/2019/44821",
        estimatedValueKobo: 45_000_000_00, createdAt: now,
      },
    ],
    witnesses: [
      {
        id: "w1", willId: "will-1", sortOrder: 0, fullName: "Tunde Bello",
        occupation: "Banker", email: null, phone: null,
        address: "18 Glover Road, Ikoyi, Lagos", createdAt: now,
      },
      {
        id: "w2", willId: "will-1", sortOrder: 1, fullName: "Ngozi Eze",
        occupation: "Teacher", email: null, phone: null,
        address: "7 Norman Williams Street, Ikoyi, Lagos", createdAt: now,
      },
    ],
    ...overrides,
  } as FullWill;
}

describe("will PDF generation", () => {
  it("produces a valid, multi-page PDF", async () => {
    const buffer = await generateWillPdf(buildWill());

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(2_000);

    const parsed = await PDFDocument.load(buffer);
    expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(parsed.getTitle()).toContain("CW-2026-4F3A9C");
  });

  it("renders an unfinished will without throwing", async () => {
    const sparse = buildWill({
      fullLegalName: null,
      dateOfBirth: null,
      addressLine1: null,
      city: null,
      state: null,
      executors: [],
      beneficiaries: [],
      guardians: [],
      bequests: [],
      assets: [],
      witnesses: [],
      funeralPreference: null,
      hasMinorChildren: null,
    });

    const buffer = await generateWillPdf(sparse, { draft: true });
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("paginates long content instead of overflowing a single page", async () => {
    const many = buildWill({
      bequests: Array.from({ length: 60 }, (_, i) => ({
        id: `q${i}`, willId: "will-1", sortOrder: i,
        itemDescription: `Item ${i}: ${"a detailed description of the chattel ".repeat(4)}`,
        recipientName: `Recipient ${i}`, recipientRelationship: "Friend",
        notes: null, createdAt: new Date(),
      })) as FullWill["bequests"],
    });

    const parsed = await PDFDocument.load(await generateWillPdf(many));
    expect(parsed.getPageCount()).toBeGreaterThan(2);
  });

  it("wraps a single unbroken word longer than the measure", async () => {
    const will = buildWill({
      specialInstructions: "x".repeat(400),
    });
    const buffer = await generateWillPdf(will);
    expect(buffer.byteLength).toBeGreaterThan(2_000);
  });

  it("derives a filesystem-safe download name", () => {
    expect(willFileName(buildWill())).toBe("CW-2026-4F3A9C-ada-chinelo-okafor.pdf");
    expect(willFileName(buildWill({ fullLegalName: null }))).toBe("CW-2026-4F3A9C-will.pdf");
  });
});
