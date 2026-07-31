import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

/**
 * Drizzle Kit runs outside the Next.js runtime, so it does not inherit Next's
 * env loading. The precedence below mirrors Next: `.env.local` overrides
 * `.env`, so a developer's local overrides work for migrations too.
 */
config({ path: [".env.local", ".env"] });

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
