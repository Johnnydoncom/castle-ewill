import {
  bigint,
  boolean,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Identity                                                                   */
/* -------------------------------------------------------------------------- */

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 191 }),
    email: varchar("email", { length: 191 }).notNull(),
    emailVerifiedAt: timestamp("email_verified_at"),
    passwordHash: varchar("password_hash", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    phoneVerifiedAt: timestamp("phone_verified_at"),
    image: varchar("image", { length: 512 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    status: mysqlEnum("status", ["active", "suspended", "deleted"])
      .default("active")
      .notNull(),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
    lastLoginAt: timestamp("last_login_at"),
    failedLoginAttempts: int("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow()
      .notNull(),
  },
  (t) => [
    unique("users_email_unique").on(t.email),
    index("users_role_idx").on(t.role),
    index("users_status_idx").on(t.status),
  ],
);

/** Auth.js OAuth account linkage — present so social login can be added without a migration. */
export const accounts = mysqlTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 128 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 191 }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: int("expires_at"),
    tokenType: varchar("token_type", { length: 64 }),
    scope: varchar("scope", { length: 512 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 512 }),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("accounts_user_id_idx").on(t.userId),
  ],
);

export const sessions = mysqlTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: datetime("expires").notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

/** Auth.js verification tokens (magic links / email verification callbacks). */
export const verificationTokens = mysqlTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 191 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: datetime("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/**
 * Single-use tokens for email verification, password reset and phone OTP.
 * Only the SHA-256 hash of the token is stored, never the token itself.
 */
export const authTokens = mysqlTable(
  "auth_tokens",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: mysqlEnum("purpose", [
      "email_verification",
      "password_reset",
      "phone_otp",
      "two_factor",
    ]).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("auth_tokens_hash_idx").on(t.tokenHash),
    index("auth_tokens_user_purpose_idx").on(t.userId, t.purpose),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Wills                                                                      */
/* -------------------------------------------------------------------------- */

export const willStatuses = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "executed",
  "archived",
] as const;

export const wills = mysqlTable(
  "wills",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Human-facing document number, e.g. CW-2026-000148 */
    reference: varchar("reference", { length: 32 }).notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    status: mysqlEnum("status", willStatuses).default("draft").notNull(),
    version: int("version").default(1).notNull(),
    currentStep: int("current_step").default(1).notNull(),
    completionPercent: int("completion_percent").default(0).notNull(),

    // Step 1 — personal particulars (snapshotted onto the will, not the profile)
    fullLegalName: varchar("full_legal_name", { length: 191 }),
    dateOfBirth: varchar("date_of_birth", { length: 10 }),
    nationality: varchar("nationality", { length: 96 }).default("Nigerian"),
    maritalStatus: mysqlEnum("marital_status", [
      "single",
      "married",
      "divorced",
      "widowed",
    ]),
    occupation: varchar("occupation", { length: 191 }),
    nationalId: varchar("national_id", { length: 64 }),
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 96 }),
    state: varchar("state", { length: 96 }),

    // Step 2 — declaration
    declaredLastWill: boolean("declared_last_will").default(false).notNull(),
    revokesPriorWills: boolean("revokes_prior_wills").default(false).notNull(),
    confirmedSoundMind: boolean("confirmed_sound_mind").default(false).notNull(),

    // Step 5 — guardianship gate
    hasMinorChildren: boolean("has_minor_children"),

    // Step 7 — funeral wishes
    funeralPreference: mysqlEnum("funeral_preference", [
      "burial",
      "cremation",
      "other",
    ]),
    funeralInstructions: text("funeral_instructions"),

    // Residuary estate + free-text instructions
    residuaryEstate: text("residuary_estate"),
    specialInstructions: text("special_instructions"),

    // Step 9 — review
    confirmedAccurate: boolean("confirmed_accurate").default(false).notNull(),

    submittedAt: timestamp("submitted_at"),
    approvedAt: timestamp("approved_at"),
    lastGeneratedAt: timestamp("last_generated_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow()
      .notNull(),
  },
  (t) => [
    unique("wills_reference_unique").on(t.reference),
    index("wills_user_id_idx").on(t.userId),
    index("wills_status_idx").on(t.status),
  ],
);

export const executors = mysqlTable(
  "executors",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    sortOrder: int("sort_order").default(0).notNull(),
    isAlternate: boolean("is_alternate").default(false).notNull(),
    fullName: varchar("full_name", { length: 191 }).notNull(),
    relationship: varchar("relationship", { length: 96 }),
    email: varchar("email", { length: 191 }),
    phone: varchar("phone", { length: 32 }),
    address: varchar("address", { length: 512 }).notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("executors_will_id_idx").on(t.willId)],
);

export const beneficiaries = mysqlTable(
  "beneficiaries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    sortOrder: int("sort_order").default(0).notNull(),
    fullName: varchar("full_name", { length: 191 }).notNull(),
    relationship: varchar("relationship", { length: 96 }).notNull(),
    email: varchar("email", { length: 191 }),
    phone: varchar("phone", { length: 32 }),
    address: varchar("address", { length: 512 }),
    /** Percentage of the residuary estate, 0.00 – 100.00 */
    sharePercent: decimal("share_percent", { precision: 5, scale: 2 })
      .default("0.00")
      .notNull(),
    isContingent: boolean("is_contingent").default(false).notNull(),
    notes: varchar("notes", { length: 512 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("beneficiaries_will_id_idx").on(t.willId)],
);

export const guardians = mysqlTable(
  "guardians",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    sortOrder: int("sort_order").default(0).notNull(),
    isAlternate: boolean("is_alternate").default(false).notNull(),
    fullName: varchar("full_name", { length: 191 }).notNull(),
    relationship: varchar("relationship", { length: 96 }),
    phone: varchar("phone", { length: 32 }),
    address: varchar("address", { length: 512 }).notNull(),
    /** Comma-free free text naming the children this guardian is appointed over. */
    childrenCovered: varchar("children_covered", { length: 512 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("guardians_will_id_idx").on(t.willId)],
);

export const bequests = mysqlTable(
  "bequests",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    sortOrder: int("sort_order").default(0).notNull(),
    itemDescription: varchar("item_description", { length: 512 }).notNull(),
    recipientName: varchar("recipient_name", { length: 191 }).notNull(),
    recipientRelationship: varchar("recipient_relationship", { length: 96 }),
    notes: varchar("notes", { length: 512 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("bequests_will_id_idx").on(t.willId)],
);

export const assetTypes = [
  "real_estate",
  "bank_account",
  "shares",
  "business",
  "vehicle",
  "digital",
  "insurance",
  "other",
] as const;

export const assets = mysqlTable(
  "assets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    sortOrder: int("sort_order").default(0).notNull(),
    type: mysqlEnum("type", assetTypes).notNull(),
    description: varchar("description", { length: 512 }).notNull(),
    institution: varchar("institution", { length: 191 }),
    identifier: varchar("identifier", { length: 191 }),
    estimatedValueKobo: bigint("estimated_value_kobo", { mode: "number" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("assets_will_id_idx").on(t.willId)],
);

export const witnesses = mysqlTable(
  "witnesses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    sortOrder: int("sort_order").default(0).notNull(),
    fullName: varchar("full_name", { length: 191 }).notNull(),
    occupation: varchar("occupation", { length: 191 }),
    email: varchar("email", { length: 191 }),
    phone: varchar("phone", { length: 32 }),
    address: varchar("address", { length: 512 }).notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("witnesses_will_id_idx").on(t.willId)],
);

/** Immutable snapshot of a will at each submission, for revision history. */
export const willRevisions = mysqlTable(
  "will_revisions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    willId: varchar("will_id", { length: 36 })
      .notNull()
      .references(() => wills.id, { onDelete: "cascade" }),
    version: int("version").notNull(),
    snapshot: json("snapshot").notNull(),
    summary: varchar("summary", { length: 512 }),
    changedByUserId: varchar("changed_by_user_id", { length: 36 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    unique("will_revisions_will_version_unique").on(t.willId, t.version),
    index("will_revisions_will_id_idx").on(t.willId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Documents, payments, comms                                                 */
/* -------------------------------------------------------------------------- */

export const documents = mysqlTable(
  "documents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    willId: varchar("will_id", { length: 36 }).references(
      () => wills.id,
      { onDelete: "cascade" },
    ),
    kind: mysqlEnum("kind", [
      "identity_document",
      "passport_photograph",
      "supporting_document",
      "generated_will",
      "signed_will",
    ]).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    sizeBytes: int("size_bytes").notNull(),
    storageProvider: mysqlEnum("storage_provider", ["local", "s3", "gdrive"])
      .notNull(),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    isEncrypted: boolean("is_encrypted").default(true).notNull(),
    checksum: varchar("checksum", { length: 64 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("documents_user_id_idx").on(t.userId),
    index("documents_will_id_idx").on(t.willId),
  ],
);

export const plans = mysqlTable(
  "plans",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 96 }).notNull(),
    tagline: varchar("tagline", { length: 191 }),
    description: text("description"),
    priceKobo: bigint("price_kobo", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
    features: json("features").$type<string[]>().notNull(),
    isPopular: boolean("is_popular").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: int("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow()
      .notNull(),
  },
  (t) => [unique("plans_slug_unique").on(t.slug)],
);

export const payments = mysqlTable(
  "payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    willId: varchar("will_id", { length: 36 }).references(() => wills.id, {
      onDelete: "set null",
    }),
    planId: varchar("plan_id", { length: 36 }).references(() => plans.id, {
      onDelete: "set null",
    }),
    reference: varchar("reference", { length: 128 }).notNull(),
    provider: mysqlEnum("provider", [
      "paystack",
      "flutterwave",
      "bank_transfer",
    ]).notNull(),
    amountKobo: bigint("amount_kobo", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
    status: mysqlEnum("status", [
      "pending",
      "success",
      "failed",
      "abandoned",
      "refunded",
    ])
      .default("pending")
      .notNull(),
    paidAt: timestamp("paid_at"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow()
      .notNull(),
  },
  (t) => [
    unique("payments_reference_unique").on(t.reference),
    index("payments_user_id_idx").on(t.userId),
    index("payments_status_idx").on(t.status),
  ],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", [
      "system",
      "will_review",
      "payment",
      "reminder",
      "security",
    ])
      .default("system")
      .notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    body: varchar("body", { length: 1024 }).notNull(),
    href: varchar("href", { length: 512 }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("notifications_user_id_idx").on(t.userId)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 96 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: varchar("entity_id", { length: 36 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 512 }),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

export const contactMessages = mysqlTable(
  "contact_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    subject: varchar("subject", { length: 191 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", ["new", "in_progress", "closed"])
      .default("new")
      .notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [index("contact_messages_status_idx").on(t.status)],
);

export const posts = mysqlTable(
  "posts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    slug: varchar("slug", { length: 191 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 96 }).notNull(),
    excerpt: varchar("excerpt", { length: 512 }).notNull(),
    body: text("body").notNull(),
    readingMinutes: int("reading_minutes").default(4).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    unique("posts_slug_unique").on(t.slug),
    index("posts_published_idx").on(t.isPublished),
  ],
);

/**
 * Face verification attempts.
 *
 * A Will cannot be submitted without a `passed` record. Frames captured during
 * the liveness challenge are held in the encrypted vault (`documents`), so only
 * the decision and its evidence trail live here.
 */
export const faceVerifications = mysqlTable(
  "face_verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    willId: varchar("will_id", { length: 36 }).references(() => wills.id, {
      onDelete: "cascade",
    }),
    status: mysqlEnum("status", [
      "pending",
      "passed",
      "failed",
      "expired",
    ])
      .default("pending")
      .notNull(),
    provider: mysqlEnum("provider", ["manual_review", "dojah", "smile_id"])
      .notNull(),
    /** The randomised challenge sequence the user was asked to perform. */
    challenges: json("challenges").$type<string[]>(),
    /** Which of those the browser reported as completed. */
    completedChallenges: json("completed_challenges").$type<string[]>(),
    /** Provider confidence for the ID face-match, 0–100 where available. */
    matchScore: int("match_score"),
    /** Provider liveness confidence, 0–100 where available. */
    livenessScore: int("liveness_score"),
    providerReference: varchar("provider_reference", { length: 191 }),
    failureReason: varchar("failure_reason", { length: 512 }),
    /** Captured frame, stored encrypted via the documents table. */
    captureDocumentId: varchar("capture_document_id", { length: 36 }),
    reviewedByUserId: varchar("reviewed_by_user_id", { length: 36 }),
    reviewedAt: timestamp("reviewed_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (t) => [
    index("face_verifications_user_id_idx").on(t.userId),
    index("face_verifications_will_id_idx").on(t.willId),
    index("face_verifications_status_idx").on(t.status),
  ],
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
});

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  wills: many(wills),
  documents: many(documents),
  payments: many(payments),
  notifications: many(notifications),
}));

export const willsRelations = relations(wills, ({ one, many }) => ({
  user: one(users, { fields: [wills.userId], references: [users.id] }),
  executors: many(executors),
  beneficiaries: many(beneficiaries),
  guardians: many(guardians),
  bequests: many(bequests),
  assets: many(assets),
  witnesses: many(witnesses),
  revisions: many(willRevisions),
  documents: many(documents),
}));

export const executorsRelations = relations(executors, ({ one }) => ({
  will: one(wills, { fields: [executors.willId], references: [wills.id] }),
}));
export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  will: one(wills, { fields: [beneficiaries.willId], references: [wills.id] }),
}));
export const guardiansRelations = relations(guardians, ({ one }) => ({
  will: one(wills, { fields: [guardians.willId], references: [wills.id] }),
}));
export const bequestsRelations = relations(bequests, ({ one }) => ({
  will: one(wills, { fields: [bequests.willId], references: [wills.id] }),
}));
export const assetsRelations = relations(assets, ({ one }) => ({
  will: one(wills, { fields: [assets.willId], references: [wills.id] }),
}));
export const witnessesRelations = relations(witnesses, ({ one }) => ({
  will: one(wills, { fields: [witnesses.willId], references: [wills.id] }),
}));
export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  will: one(wills, { fields: [documents.willId], references: [wills.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  plan: one(plans, { fields: [payments.planId], references: [plans.id] }),
  will: one(wills, { fields: [payments.willId], references: [wills.id] }),
}));

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Will = typeof wills.$inferSelect;
export type NewWill = typeof wills.$inferInsert;
export type Executor = typeof executors.$inferSelect;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Bequest = typeof bequests.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Witness = typeof witnesses.$inferSelect;
export type DocumentRecord = typeof documents.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type FaceVerification = typeof faceVerifications.$inferSelect;
export type WillStatus = (typeof willStatuses)[number];
export type AssetType = (typeof assetTypes)[number];
