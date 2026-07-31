import { z } from "zod";

import { assetTypes } from "@/lib/db/schema";

/**
 * Per-step validation schemas.
 *
 * These run on the client for immediate feedback and again inside every server
 * action — the client copy is a convenience, the server copy is the guarantee.
 */

const trimmed = (max: number) => z.string().trim().max(max);
const requiredText = (label: string, max = 191) =>
  trimmed(max).min(1, `${label} is required`);

const optionalText = (max = 191) =>
  trimmed(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const optionalEmail = z
  .string()
  .trim()
  .max(191)
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .refine(
    (v) => v === undefined || z.string().email().safeParse(v).success,
    "Enter a valid email address",
  );

/** Nigerian mobile numbers, tolerant of +234 / 0 prefixes and spacing. */
export const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .refine(
    (v) => /^(\+?234|0)?[789][01]\d{8}$/.test(v.replace(/[\s()-]/g, "")),
    "Enter a valid Nigerian phone number",
  );

const optionalPhone = z
  .string()
  .trim()
  .max(32)
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .refine(
    (v) => v === undefined || phoneSchema.safeParse(v).success,
    "Enter a valid Nigerian phone number",
  );

/** ISO date (YYYY-MM-DD) that is in the past and implies an age of 18–120. */
export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker to supply a valid date")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime());
  }, "Enter a valid date")
  .refine((value) => ageFromDateOfBirth(value) >= 18, "You must be at least 18 to make a Will")
  .refine((value) => ageFromDateOfBirth(value) <= 120, "Enter a valid date of birth");

export function ageFromDateOfBirth(value: string, now = new Date()): number {
  const dob = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return Number.NaN;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/* ------------------------------- Step 1 ---------------------------------- */

export const personalSchema = z.object({
  fullLegalName: requiredText("Full legal name"),
  dateOfBirth: dateOfBirthSchema,
  nationality: requiredText("Nationality", 96),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"], {
    message: "Select your marital status",
  }),
  occupation: optionalText(191),
  nationalId: optionalText(64),
  addressLine1: requiredText("Residential address", 255),
  addressLine2: optionalText(255),
  city: requiredText("City", 96),
  state: requiredText("State", 96),
});

/* ------------------------------- Step 2 ---------------------------------- */

export const declarationSchema = z.object({
  declaredLastWill: z.literal(true, {
    message: "You must declare this to be your Last Will and Testament",
  }),
  revokesPriorWills: z.literal(true, {
    message: "You must revoke all prior Wills and codicils",
  }),
  confirmedSoundMind: z.literal(true, {
    message: "You must confirm you are of sound mind and of legal age",
  }),
});

/* ------------------------------- Step 3 ---------------------------------- */

export const executorSchema = z.object({
  id: z.string().optional(),
  fullName: requiredText("Executor name"),
  relationship: optionalText(96),
  email: optionalEmail,
  phone: optionalPhone,
  address: requiredText("Executor address", 512),
  isAlternate: z.boolean().default(false),
});

export const executorsSchema = z.object({
  executors: z
    .array(executorSchema)
    .min(1, "Appoint at least one executor")
    .max(6, "You may appoint at most six executors")
    .refine(
      (list) => list.some((e) => !e.isAlternate),
      "At least one executor must be a primary (non-alternate) appointment",
    ),
});

/* ------------------------------- Step 4 ---------------------------------- */

export const beneficiarySchema = z.object({
  id: z.string().optional(),
  fullName: requiredText("Beneficiary name"),
  relationship: requiredText("Relationship", 96),
  email: optionalEmail,
  phone: optionalPhone,
  address: optionalText(512),
  sharePercent: z.coerce
    .number({ message: "Enter a share percentage" })
    .min(0, "Share cannot be negative")
    .max(100, "Share cannot exceed 100%"),
  isContingent: z.boolean().default(false),
  notes: optionalText(512),
});

/** Shares are compared in basis points to avoid binary floating-point drift. */
export function sharesTotal(shares: number[]): number {
  return shares.reduce((sum, value) => sum + Math.round(value * 100), 0);
}

export const beneficiariesSchema = z
  .object({
    beneficiaries: z
      .array(beneficiarySchema)
      .min(1, "Name at least one beneficiary")
      .max(24, "You may name at most twenty-four beneficiaries"),
    residuaryEstate: optionalText(2000),
  })
  .refine(
    (data) => {
      const primary = data.beneficiaries.filter((b) => !b.isContingent);
      return sharesTotal(primary.map((b) => b.sharePercent)) === 10_000;
    },
    {
      message: "Primary beneficiary shares must total exactly 100%",
      path: ["beneficiaries"],
    },
  );

/* ------------------------------- Step 5 ---------------------------------- */

export const guardianSchema = z.object({
  id: z.string().optional(),
  fullName: requiredText("Guardian name"),
  relationship: optionalText(96),
  phone: optionalPhone,
  address: requiredText("Guardian address", 512),
  childrenCovered: optionalText(512),
  isAlternate: z.boolean().default(false),
});

export const guardianshipSchema = z
  .object({
    hasMinorChildren: z.boolean(),
    guardians: z.array(guardianSchema).max(6),
  })
  .refine(
    (data) =>
      !data.hasMinorChildren ||
      data.guardians.some((g) => !g.isAlternate),
    {
      message: "Appoint at least one guardian for your minor children",
      path: ["guardians"],
    },
  );

/* ------------------------------- Step 6 ---------------------------------- */

export const bequestSchema = z.object({
  id: z.string().optional(),
  itemDescription: requiredText("Item description", 512),
  recipientName: requiredText("Recipient name"),
  recipientRelationship: optionalText(96),
  notes: optionalText(512),
});

export const bequestsSchema = z.object({
  bequests: z.array(bequestSchema).max(50, "You may list at most fifty bequests"),
});

/* ------------------------------ Assets ----------------------------------- */

export const assetSchema = z.object({
  id: z.string().optional(),
  type: z.enum(assetTypes),
  description: requiredText("Asset description", 512),
  institution: optionalText(191),
  identifier: optionalText(191),
  estimatedValueNaira: z.coerce
    .number()
    .min(0, "Value cannot be negative")
    .optional(),
});

export const assetsSchema = z.object({
  assets: z.array(assetSchema).max(100),
});

/* ------------------------------- Step 7 ---------------------------------- */

export const funeralSchema = z.object({
  funeralPreference: z.enum(["burial", "cremation", "other"], {
    message: "Select a preference",
  }),
  funeralInstructions: optionalText(2000),
  specialInstructions: optionalText(2000),
});

/* ------------------------------- Step 8 ---------------------------------- */

export const witnessSchema = z.object({
  id: z.string().optional(),
  fullName: requiredText("Witness name"),
  occupation: optionalText(191),
  email: optionalEmail,
  phone: optionalPhone,
  address: requiredText("Witness address", 512),
});

export const witnessesSchema = z.object({
  witnesses: z
    .array(witnessSchema)
    .length(2, "A Will requires exactly two witnesses"),
});

/* ------------------------------- Step 9 ---------------------------------- */

export const reviewSchema = z.object({
  confirmedAccurate: z.literal(true, {
    message: "Confirm that the information in your Will is accurate",
  }),
});

/* --------------------------- Cross-step rules ----------------------------- */

function normaliseName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * A beneficiary must not also be a witness. Under the Wills Act a gift to an
 * attesting witness is void, so we block the combination at source rather than
 * generate a Will with an unenforceable clause.
 */
export function conflictingWitnesses(
  beneficiaryNames: string[],
  witnessNames: string[],
): string[] {
  const beneficiaries = new Set(beneficiaryNames.map(normaliseName));
  return witnessNames.filter((name) => beneficiaries.has(normaliseName(name)));
}

export type PersonalInput = z.infer<typeof personalSchema>;
export type DeclarationInput = z.infer<typeof declarationSchema>;
export type ExecutorsInput = z.infer<typeof executorsSchema>;
export type BeneficiariesInput = z.infer<typeof beneficiariesSchema>;
export type GuardianshipInput = z.infer<typeof guardianshipSchema>;
export type BequestsInput = z.infer<typeof bequestsSchema>;
export type AssetsInput = z.infer<typeof assetsSchema>;
export type FuneralInput = z.infer<typeof funeralSchema>;
export type WitnessesInput = z.infer<typeof witnessesSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
