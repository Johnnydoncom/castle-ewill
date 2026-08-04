/**
 * Deterministic environment for unit tests.
 *
 * Much shorter than it was. Since the backend moved to Laravel, nothing in this
 * tier opens a database connection, an SMTP session, a storage client or a
 * payment provider — so there are no such credentials to stub. What remains is
 * the API address and the session secret.
 *
 * NODE_ENV is set to "test" by Vitest itself and is read-only, so it is not
 * assigned here.
 */
process.env.APP_URL = "http://localhost:3000";
process.env.API_URL = "http://localhost:8000/api/v1";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1";
process.env.AUTH_SECRET = "test-secret-that-is-long-enough-for-validation";
