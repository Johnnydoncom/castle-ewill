import { z } from "zod";

/**
 * Environment configuration.
 *
 * Validation is skipped during `next build` (and when SKIP_ENV_VALIDATION is set)
 * so that a container image can be built without production secrets present.
 * At runtime the first access throws a descriptive error listing every missing
 * or malformed variable.
 */

const booleanish = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /** Public origin of the deployment, e.g. https://castleewill.com */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /** mysql://user:password@host:3306/database */
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (v) => v.startsWith("mysql://") || v.startsWith("mysql2://"),
      "DATABASE_URL must be a mysql:// connection string",
    ),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  DATABASE_SSL: booleanish.default("false"),

  /** openssl rand -base64 32 */
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_TRUST_HOST: booleanish.default("true"),

  /** 32-byte key, base64 encoded — encrypts vault documents at rest. */
  ENCRYPTION_KEY: z
    .string()
    .min(1, "ENCRYPTION_KEY is required")
    .refine((v) => {
      try {
        return Buffer.from(v, "base64").length === 32;
      } catch {
        return false;
      }
    }, "ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)"),

  // ---- Mail (SMTP / Nodemailer) -------------------------------------------
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: booleanish.default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default("Castle eWill & Trust <ewillcastle@gmail.com>"),
  MAIL_REPLY_TO: z.string().optional(),

  // ---- Storage -------------------------------------------------------------
  STORAGE_PROVIDER: z.enum(["local", "s3", "gdrive"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(".storage"),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  GDRIVE_CLIENT_EMAIL: z.string().optional(),
  GDRIVE_PRIVATE_KEY: z.string().optional(),
  GDRIVE_FOLDER_ID: z.string().optional(),

  // ---- Payments (phase 2 wiring, validated when present) -------------------
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  /**
   * The "secret hash" set in the Flutterwave dashboard. Flutterwave sends it
   * back verbatim in the `verif-hash` header — unlike Paystack it does not sign
   * the payload, so this shared value is the only thing authenticating a
   * webhook. Without it, webhooks are refused rather than trusted blindly.
   */
  FLUTTERWAVE_SECRET_HASH: z.string().optional(),

  // ---- Identity verification ----------------------------------------------
  /**
   * `manual_review` stores the capture for an administrator to compare against
   * the uploaded ID. `dojah` performs an automated liveness and face match.
   * Browser-side liveness alone is not anti-spoofing, so an automated provider
   * is what makes the check trustworthy in production.
   */
  VERIFICATION_PROVIDER: z
    .enum(["manual_review", "dojah"])
    .default("manual_review"),
  DOJAH_APP_ID: z.string().optional(),
  DOJAH_SECRET_KEY: z.string().optional(),

  // ---- SMS (Termii) --------------------------------------------------------
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().default("Castle"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.NEXT_PHASE === "phase-production-build";

function loadEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env and fill in the missing values.`,
    );
  }

  const env = parsed.data;

  // Cross-field checks that zod cannot express in isolation.
  if (env.STORAGE_PROVIDER === "s3") {
    const missing = (
      ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const
    ).filter((k) => !env[k]);
    if (missing.length) {
      throw new Error(
        `STORAGE_PROVIDER=s3 requires: ${missing.join(", ")}`,
      );
    }
  }

  if (env.VERIFICATION_PROVIDER === "dojah") {
    const missing = (["DOJAH_APP_ID", "DOJAH_SECRET_KEY"] as const).filter(
      (k) => !env[k],
    );
    if (missing.length) {
      throw new Error(
        `VERIFICATION_PROVIDER=dojah requires: ${missing.join(", ")}`,
      );
    }
  }

  if (env.STORAGE_PROVIDER === "gdrive") {
    const missing = (
      ["GDRIVE_CLIENT_EMAIL", "GDRIVE_PRIVATE_KEY", "GDRIVE_FOLDER_ID"] as const
    ).filter((k) => !env[k]);
    if (missing.length) {
      throw new Error(
        `STORAGE_PROVIDER=gdrive requires: ${missing.join(", ")}`,
      );
    }
  }

  return env;
}

/** Placeholder values used only when validation is intentionally skipped. */
const buildTimeFallback = serverSchema.parse({
  NODE_ENV: process.env.NODE_ENV ?? "production",
  DATABASE_URL: "mysql://build:build@localhost:3306/build",
  AUTH_SECRET: "build-time-placeholder-secret-value-000000",
  ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
});

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  cached = skipValidation ? buildTimeFallback : loadEnv();
  return cached;
}

export const isProduction = () => getEnv().NODE_ENV === "production";
export const isDevelopment = () => getEnv().NODE_ENV === "development";
