import { z } from "zod";

/**
 * Environment configuration.
 *
 * A shadow of what it was. Since the migration to the Laravel API this tier
 * holds no database URL, no encryption key, no SMTP account, no storage
 * credentials, no payment secrets and no KYC keys — every one of those lives in
 * `backend/.env`, behind a process the browser never talks to.
 *
 * What remains is the address of the API and the secret that encrypts the
 * session cookie. If this file starts growing again, that is the signal that
 * backend work has crept back into the frontend.
 *
 * Validation is skipped during `next build` so a container image can be built
 * without production secrets present. At runtime the first access throws a
 * descriptive error listing everything missing or malformed.
 */

const booleanish = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /** Public origin of this deployment, e.g. https://castleewill.com */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /**
   * The Laravel API, including its version prefix.
   *
   * Server-side only, so it may be an internal address — traffic between the
   * two tiers that never leaves the host cannot be intercepted on the way.
   */
  API_URL: z
    .string()
    .url("API_URL must be a URL, e.g. http://localhost:8000/api/v1"),

  /**
   * The same API as the browser must address it.
   *
   * Inlined into the client bundle, so it must be publicly reachable and must
   * never carry a credential. Used only for direct links — vault downloads,
   * generated PDFs and the public contact endpoint — each of which the backend
   * authorises or rate-limits itself.
   */
  NEXT_PUBLIC_API_URL: z.string().url(),

  /** Encrypts the Auth.js JWT, which carries the Sanctum bearer token. */
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_TRUST_HOST: booleanish.default("true"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;

  /*
   * `next build` evaluates modules without runtime secrets. Placeholders keep
   * the build from failing on values only needed once a request arrives; this
   * is also why every page that reads the session is `force-dynamic`, since
   * anything prerendered would bake in these placeholders.
   */
  if (
    process.env.SKIP_ENV_VALIDATION === "1" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    cached = {
      NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) ?? "development",
      APP_URL: process.env.APP_URL ?? "http://localhost:3000",
      API_URL: process.env.API_URL ?? "http://localhost:8000/api/v1",
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
      AUTH_SECRET: "build-time-placeholder-value-0000000",
      AUTH_TRUST_HOST: true,
    };

    return cached;
  }

  const parsed = schema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    API_URL: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  });

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${detail}`);
  }

  cached = parsed.data;

  return cached;
}
