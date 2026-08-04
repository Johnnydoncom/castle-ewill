# Castle eWill & Trust — project context

Online Will drafting platform for Nigeria. Client: Castle eWill and Trust
Limited (RC 9701348). Source requirements: `docs/PRD.docx` and
`docs/WEBSITE DETAILS.docx`.

## Agreed decisions

| Question | Decision |
| --- | --- |
| Sequencing | Foundation first: DB, auth, mail, storage, Will domain, PDF. Payments/admin/verification are phase 2. |
| Design direction | **Keep** the editorial navy + antique-gold look (Fraunces serif, magazine layout). Do not switch to the generic SaaS style in `docs/ui-design.md`. Refine spacing, contrast and consistency instead. |
| Wizard flow | **9 steps** from WEBSITE DETAILS, not the 8 in PRD §2: Personal → Declaration → Executor → Beneficiaries → Guardianship (conditional) → Bequests → Funeral → Witnesses → Review. |
| Database | MySQL + Drizzle, env-driven via `DATABASE_URL`. No provider lock-in. |
| Email | Nodemailer over generic SMTP. Console fallback in dev, hard error in prod. |
| File storage | Storage **abstraction** with local / S3-R2 / Google Drive adapters. Google Drive was requested but is a poor primary for KYC documents (no presigned uploads, service accounts have no quota, rate limits) — R2's free tier is the recommended default. Encryption sits above the adapters so Drive only holds ciphertext. |
| Facial verification | **Implemented.** Randomised liveness challenge (MediaPipe in-browser) + provider abstraction. Client-side liveness is UX and a first filter only — it is NOT anti-spoofing. The gate is server-side in `submitWillAction`; the challenge sequence is issued and stored server-side so a recording cannot be replayed. Use `VERIFICATION_PROVIDER=dojah` in production. |
| Two-factor | RFC 6238 TOTP hand-rolled on `node:crypto`, verified against the RFC's published vectors. Secrets sealed with the vault's AES-256-GCM envelope. No QR rendering — the setup key is entered manually rather than shipping the secret to an image service. |
| Payment trust model | The webhook is authoritative; the browser callback is a convenience. Both call the same idempotent `settlePayment()`. Prices are read from the `plans` table, never from the form, and the verified amount is compared against the record before settling. |
| Payments | All three implemented: Paystack, Flutterwave and bank transfer. Flutterwave denominates in **naira**, everything stored is **kobo** — convert at the boundary (`koboToNaira` / `nairaToKobo`, rounded not truncated). |

## Conventions

- Strict TypeScript. No placeholder implementations, no `any` without a reason.
- Validate on the client for feedback and again on the server for the guarantee.
- Money is stored in **kobo** as integers. Percentages compare in basis points.
- All ids are UUID v4 `varchar(36)`.
- `lib/company.ts` is the single source of truth for company identity — never
  hardcode the address, RC number, phone or email anywhere else.
- Repository reads are ownership-scoped (`userId`); admin callers pass `null`
  deliberately.

## Environment notes

- `next build` could not be run in the authoring sandbox: the 91 MB
  `@next/swc-linux-x64-gnu` binary triggers SIGBUS when memory-mapped there.
  Other native modules load fine, so this is a sandbox limit, not a code fault.
  Verification used `tsc --noEmit`, ESLint and Vitest instead. **Run
  `npm run build` locally to confirm the bundler step.**
- `next lint` was removed in Next 16; linting goes through the ESLint CLI with
  a flat config (`eslint.config.mjs`). The original `eslint.config.js` was a
  leftover Vite/TanStack template referencing uninstalled plugins.
- nodemailer is pinned to `^8` because Auth.js v5 declares a
  `^7 || ^8` peer range; nodemailer 9 breaks resolution.

## Additional conventions established

- Server actions return `FormState` (`lib/actions/state.ts`) and are consumed
  with `useActionState`. Field errors are keyed by form field name.
- Repeatable wizard rows post as `executors.0.fullName`; `collectRows()` in
  `lib/actions/will.ts` reassembles them. Row keys are stable client ids so
  removing a row does not reset the inputs below it.
- `loadOwnedWill()` is the single ownership gate for every wizard action. It
  returns an explicitly discriminated union — inferring the union from bare
  object literals leaves the error branch optional and defeats narrowing.
- Auth.js reserves `emailVerified` as `Date | null` on `AdapterUser`; our
  session flag is `isEmailVerified` to avoid the clash.
- Enumeration is not possible from register / reset / resend — all three return
  the same message whether or not the account exists.
- `components/ui/**` is vendored shadcn/ui. Two React-compiler lint rules are
  disabled for that directory only, so it stays re-generatable from upstream.
- Fonts are self-hosted via `next/font`, not a `<link>` to Google.
- Focus styling is global (`:focus-visible` in `globals.css`), not per-component.
  Do not add `focus:outline-none` without a visible replacement.
- No page may invent people, credentials or review notes. The advisors page
  renders real `will_revisions` summaries; it previously named a fictional
  barrister with a stock portrait.
- Drizzle Kit and the seed script load `.env.local` then `.env`, matching Next.

## Sandbox caveats (important)

The authoring sandbox repeatedly delivered broken native binaries. Do not treat
these as code faults:

- `next build` SIGBUSes on the 91 MB `@next/swc-linux-x64-gnu` binary.
- On a rebuild, several packages installed without their type declarations
  (`lucide-react`, `next-auth`, `@aws-sdk/*`) and had to be reinstalled.
- `@rollup/rollup-linux-x64-gnu` was missing entirely, then Vitest began
  core-dumping on a trivial test and never recovered.

**Resolved 2026-07-31:** `npm run build`, `npm test` (112 passing), `tsc --noEmit`
and ESLint all pass locally on Windows. The first real build exposed two faults
the sandbox had hidden — see "Build and runtime rules" below.

## Build and runtime rules

- **Never delete an `import "server-only"` to make the bundler stop
  complaining.** It means a client component is importing a server module;
  split the pure half out instead. `lib/auth/password-policy.ts` (schema,
  strength meter, bcrypt cost) exists for exactly this reason, with the bcrypt
  functions left behind the guard in `lib/auth/password.ts`.
- `server-only` also throws under plain Node/tsx, so **scripts must not import
  guarded modules**. The seed hashes with bcrypt directly, sharing
  `PASSWORD_COST` so the work factor cannot drift.
- Env for standalone scripts loads through `scripts/load-env.ts`, imported
  *first*. ES modules evaluate imports before any statement in the file, so an
  inline `config()` call would run after `@/lib/db` had already built its pool
  from an empty `process.env`. `drizzle.config.ts` uses the same loader.
- Application code must never import `dotenv` — it is a devDependency, and Next
  loads `.env*` natively.
- Pages that read the database or the session are `export const dynamic =
  "force-dynamic"` (admin and dashboard layouts, pricing, blog). `getEnv()`
  returns placeholder values during `next build`, so anything prerendered
  would either fail or bake in empty content.

## Will status transitions

`draft → submitted → approved → executed`, with `request changes` returning an
in-review Will to `draft` and incrementing `version`. Guards live in
`lib/actions/review.ts`: approving a draft is refused, approving an already
approved Will is idempotent, and only an approved Will can be marked executed.

## Next steps

1. Admin queue for `manual_review` face verifications (records exist and the
   captures are stored; there is no approve/reject screen yet).
2. Reviewer accounts distinct from full administrators, if the client wants
   solicitors who can review but not manage users or payments.
