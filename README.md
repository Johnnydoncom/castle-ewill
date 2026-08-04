# Castle eWill & Trust

Online Will drafting platform for Nigeria — guided questionnaire, legally
formatted PDF output, encrypted document vault and an administrative portal.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · MySQL 8 ·
Drizzle ORM · Auth.js v5 · Nodemailer · pdf-lib

---

## Getting started

```bash
npm install
cp .env.example .env.local  # then fill in the required values
npm run db:migrate        # create the schema
npm run db:seed           # plans, journal articles, optional admin user
npm run dev
```

The app runs at http://localhost:3000.

### Required environment values

Only four variables are needed to boot:

| Variable         | How to produce it            |
| ---------------- | ---------------------------- |
| `DATABASE_URL`   | Any MySQL 8+ connection string |
| `AUTH_SECRET`    | `openssl rand -base64 32`    |
| `ENCRYPTION_KEY` | `openssl rand -base64 32`    |
| `APP_URL`        | `http://localhost:3000` in dev |

Everything else has a working default. `lib/env.ts` validates the whole
environment on first access and fails with a list of exactly what is missing,
rather than surfacing a null-pointer error deep in a request.

> **Back up `ENCRYPTION_KEY` before going live.** Vault documents are encrypted
> with it; losing it makes stored documents unrecoverable.

With no `SMTP_HOST` set, verification and reset emails are printed to the
console instead of being sent, so the full sign-up flow works locally without
credentials. In production a missing `SMTP_HOST` is a hard error — silently
dropping a password-reset email is worse than failing loudly.

---

## Scripts

| Command               | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Development server                          |
| `npm run build`       | Production build                            |
| `npm run typecheck`   | `tsc --noEmit` across the whole project     |
| `npm run lint`        | ESLint (flat config, Next 16 presets)       |
| `npm test`            | Vitest unit suite                           |
| `npm run db:generate` | Generate a migration from schema changes    |
| `npm run db:migrate`  | Apply pending migrations                    |
| `npm run db:studio`   | Drizzle Studio                              |
| `npm run db:seed`     | Idempotent seed — safe to re-run            |

---

## Payments

Three methods are live: Paystack (cards), Flutterwave and bank transfer. All
three settle through the same idempotent `settlePayment()`, which dispatches on
the stored provider and refuses to settle a bank transfer automatically or a
card payment by hand.

**Bank transfer** details live in the `settings` table under
`payments.bank_account`, so an account number can be corrected without a
redeploy. The seed inserts an empty placeholder; until an account number is
present the instructions page says so plainly and points the client at the
phone number, rather than displaying an account nobody can pay into.

A bank transfer is settled by an administrator from `/admin/payments`. The
server refuses to settle a card payment this way — only the provider can say
whether money actually moved.

Set `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` to enable checkout. Without
them the pricing page still renders and the checkout button explains that online
payment is not yet enabled, rather than failing at the point of sale.

Point your Paystack dashboard webhook at:

```
https://<your-domain>/api/payments/paystack/webhook
https://<your-domain>/api/payments/flutterwave/webhook
```

Flutterwave additionally needs `FLUTTERWAVE_SECRET_HASH` to match the secret
hash configured in its dashboard. Unlike Paystack it does not sign payloads, so
that shared value is the only thing gating the endpoint — which is why the
transaction is always re-verified over the API before settlement.

The webhook is the authority on whether money moved; the browser callback is a
convenience. Both funnel into the same idempotent `settlePayment()`, so a
duplicate webhook, a refreshed callback, or both arriving at once settle the
payment exactly once.

## Architecture

```
app/                 Routes (App Router). Server Components by default.
  api/               Route handlers
components/
  ui/                shadcn/ui primitives
  site/  brand/      Marketing shell, logo
  dashboard/ auth/   Portal and auth shells
lib/
  db/                Drizzle schema + pooled connection
  auth/              Password hashing, single-use tokens, rate limiting, roles
  mail/              SMTP transport + branded templates
  storage/           Provider-agnostic vault (local · S3/R2 · Google Drive)
  security/          AES-256-GCM envelope, audit log
  will/              Steps, validation, completion scoring, repository, PDF
  company.ts         Single source of truth for company identity
drizzle/             Generated SQL migrations
scripts/seed.ts      Database seed
tests/               Vitest suite
```

### Notable decisions

**Storage is an abstraction, not a provider.** `StorageAdapter` has three
implementations selected by `STORAGE_PROVIDER`. Encryption happens in the
facade above the adapters, so every provider — including Google Drive — only
ever receives ciphertext. Swapping providers is an env change, not a refactor.

**Shares are compared in basis points.** Beneficiary percentages are summed as
integers (`33.33% → 3333`) because some valid splits, such as
`28.1 + 35.95 + 35.95`, total `100.00000000000001` under float addition and
would fail a strict equality check. There is a regression test for this.

**Witnesses cannot be beneficiaries.** A gift to an attesting witness is void,
so the combination is blocked at validation time rather than producing a Will
with an unenforceable clause.

**Guardianship is conditionally skipped.** Declaring no minor children removes
step 5 from both the wizard flow and the completion denominator, so a user who
legitimately skips it still reaches 100%.

**Tokens are stored as hashes.** Email-verification and password-reset tokens
are kept as SHA-256 digests and consumed atomically, so a database read cannot
be replayed into an account takeover.

**Auth runs in two halves.** `auth.config.ts` is database-free so the edge
middleware can import it; `auth.ts` adds the credentials provider. Every
protected page and server action re-checks authorisation server-side rather
than trusting the middleware alone.

---

## Testing

```bash
npm test
```

112 unit tests covering share arithmetic, date-of-birth and phone validation,
witness independence, completion scoring, conditional step navigation, the
AES-GCM envelope (including tamper detection), rate limiting, upload
validation, the encrypted vault round trip (asserting the adapter never sees
plaintext), storage-key sanitisation, Paystack webhook signature verification
(tampered body, wrong secret, missing and malformed signatures), TOTP against
the six published RFC 6238 test vectors, and real PDF generation — the PDF tests parse the produced bytes back with `pdf-lib` and
assert pagination, so the layout engine is exercised, not just typechecked.

---

## Status

**Delivered**

- MySQL schema — 21 tables with foreign keys and cascade rules, plus migrations
- Auth.js v5 credentials auth: bcrypt (cost 12), email-verification gate,
  single-use hashed tokens, account lockout, timing-safe failure paths, RBAC
  middleware, and re-asserted authorisation in every page and action
- Register / verify email / resend / forgot password / reset password / sign in
  — all wired end to end with server actions and inline validation
- The nine-step Will wizard, persisting every step, with the conditional
  guardianship skip, repeatable list builders, progress bar, completion scoring,
  Save & Exit, and a review screen with edit links back to each step
- Cross-step legal rule enforced in both directions: a beneficiary cannot be an
  attesting witness
- PDF engine: word wrapping, orphan-free pagination, running headers, numbered
  clauses, attestation block, document number and revision footer, served from
  an ownership-scoped download route
- Dashboard reading real data: active Will, completion, profile completeness,
  notifications, payments, review reminders
- SMTP mailer with branded templates; storage abstraction with local / S3-R2 /
  Google Drive adapters and AES-256-GCM applied above the adapters
- Contact form persisting to the database with rate limiting and acknowledgement
- Document vault: encrypted upload with MIME-and-extension validation, a
  decrypt-and-stream download route that re-verifies the upload checksum, and
  delete-from-storage-before-record removal
- Paystack payments: checkout that prices from the database rather than the
  form, a signature-verified webhook, idempotent settlement shared by the
  webhook and the browser callback, and an amount-mismatch guard
- Bank transfer: a quotable reference, an instructions page reading
  administrator-configurable account details, and a manual confirmation the
  server restricts to bank transfers only
- Flutterwave: hash-gated webhook, callback that ignores the attacker-supplied
  `status` parameter, and naira/kobo conversion at the boundary — all three
  providers settle through the same idempotent path
- Services and FAQs pages written from the brief, with the nine wizard steps
  rendered from the same definition the builder uses
- Face verification gating Will submission: a randomised, server-issued
  liveness challenge (turn head, open mouth, blink, smile) detected in-browser
  with MediaPipe, the capture encrypted into the vault, and a provider
  abstraction with a Dojah adapter for automated liveness plus admin review as
  the default. The gate lives in `submitWillAction`, so a client that never
  renders the check still cannot submit
- Phone verification over Termii, reusing the hashed single-use token machinery
- Two-factor authentication: RFC 6238 TOTP implemented on `node:crypto` with no
  third-party dependency, secrets sealed with AES-256-GCM before storage, a
  second-factor challenge folded into the credentials sign-in, and enrolment
  that only activates once the user proves they can produce a valid code
- Admin review workflow: approve, request changes (returns the Will to draft,
  increments the revision and emails the reviewer's note verbatim), mark
  executed, and suspend or reactivate a client — each with guarded state
  transitions, notifications and audit entries
- Accessibility pass: a `:focus-visible` ring on every interactive element
  (several inputs previously signalled focus only with a 1px border colour),
  a skip link, `prefers-reduced-motion` support, and a real `scrollbar-none`
  utility replacing a class name that had no rule behind it
- Admin console reading real data: aggregate stats computed in SQL, review queue,
  client search with pagination, Will and payment tables with status filters, and
  a settings page that runs live health checks against the database, SMTP and
  storage rather than asserting "all systems green"
- About, pricing, resources and contact pages driven by `lib/company.ts` and the
  `plans` / `posts` tables — vision, mission, core values, the ethics charter and
  the client commitments are rendered verbatim from the brief
- Security headers, audit logging, env validation
- 112 unit tests, clean ESLint flat config, seed script, `.env.example`

**Not yet done**

- **Assets are unwired.** The `assets` table and `assetSchema` exist but no
  wizard step, action or PDF clause imports them, so "Do you own land / shares /
  digital assets?" from the brief is unanswered.
- **Trustees.** "Appoint trustees" appears in the brief's dashboard list; only
  marketing copy references it.
- **Scheduled review reminders.** The 12-month / marriage / birth / property
  triggers are rendered as guidance, but nothing schedules them — there is no
  job runner in the project.
- **Admin queue for `manual_review` face verifications.** Records and captures
  exist; there is no approve/reject screen.



## Verification

All four gates pass locally (Windows, Node 22, Next 16.2.12):

| Gate                | Result                        |
| ------------------- | ----------------------------- |
| `npm run typecheck` | clean                         |
| `npm run lint`      | 0 errors, 6 warnings          |
| `npm test`          | 112 passing across 10 files   |
| `npm run build`     | succeeds — 20 static, 18 dynamic routes |

The seed has been run against a live MySQL database and re-run to confirm it is
idempotent. `/pricing` and `/blog` were verified to render seeded rows, and
`/dashboard` and `/admin` to redirect anonymous visitors to `/login`.

The first successful build exposed two faults that `tsc` and Vitest cannot see,
both since fixed and documented in `CLAUDE.md`: a `server-only` module reached a
client bundle through a shared helper, and database-backed pages were being
prerendered at build time.
