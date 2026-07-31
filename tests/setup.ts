/**
 * Deterministic environment for unit tests — no real database or SMTP.
 * NODE_ENV is set to "test" by Vitest itself and is read-only, so it is not
 * assigned here.
 */
process.env.DATABASE_URL = "mysql://test:test@127.0.0.1:3306/castle_test";
process.env.AUTH_SECRET = "test-secret-that-is-long-enough-for-validation";
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.APP_URL = "http://localhost:3000";
process.env.STORAGE_PROVIDER = "local";
process.env.PAYSTACK_SECRET_KEY = "sk_test_paystack_secret_key_for_tests";
