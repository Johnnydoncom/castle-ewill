/**
 * Idempotent database seed.
 *
 * Run with: npm run db:seed
 * Safe to re-run — every insert is guarded by an existence check, so seeding a
 * database that already has data will not duplicate rows or clobber edits.
 */
import { config } from "dotenv";

// Same precedence as Next.js: `.env.local` overrides `.env`.
config({ path: [".env.local", ".env"] });

import { eq } from "drizzle-orm";

import { db, getPool } from "@/lib/db";
import { plans, posts, settings, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { newId } from "@/lib/ids";

const PLANS = [
  {
    slug: "essential",
    name: "Essential",
    tagline: "For a straightforward Will",
    description:
      "Everything one person needs to record their wishes clearly and legally.",
    priceKobo: 25_000_00,
    features: [
      "Guided nine-step Will builder",
      "Legally formatted PDF download",
      "Encrypted document vault",
      "12 months of updates",
    ],
    isPopular: false,
    sortOrder: 1,
  },
  {
    slug: "family",
    name: "Family",
    tagline: "Most chosen by families",
    description:
      "For households with children, property and more than one beneficiary.",
    priceKobo: 55_000_00,
    features: [
      "Everything in Essential",
      "Guardianship and trustee appointments",
      "Solicitor review before sealing",
      "Unlimited updates",
      "Witness coordination",
    ],
    isPopular: true,
    sortOrder: 2,
  },
  {
    slug: "estate",
    name: "Estate",
    tagline: "For complex estates",
    description:
      "Business interests, multiple properties and trust structures.",
    priceKobo: 150_000_00,
    features: [
      "Everything in Family",
      "Dedicated estate solicitor",
      "Trust structuring advice",
      "Executor briefing pack",
      "Annual review appointment",
    ],
    isPopular: false,
    sortOrder: 3,
  },
];

const POSTS = [
  {
    slug: "dying-without-a-will-in-nigeria",
    title: "What happens if you die without a Will in Nigeria?",
    category: "Wills 101",
    excerpt:
      "Intestacy rules decide for you — and they rarely match what you would have chosen.",
    readingMinutes: 6,
    body: [
      "When a person dies without a valid Will, they are said to have died intestate. Their estate is then distributed according to rules that take no account of their relationships, their promises, or their intentions.",
      "In Nigeria the position is complicated further by the interaction of statutory law, customary law and, in some states, Islamic law. Which regime applies can depend on the type of marriage contracted, the deceased's state of origin, and the nature of the property.",
      "The practical consequences are familiar to every probate practitioner: a surviving spouse who cannot access the family account, children whose school fees stall, and relatives who arrive with claims that the deceased would never have entertained.",
      "A Will removes that uncertainty. It names the people who will administer the estate, sets out who receives what, and appoints guardians for children who are still minors.",
    ].join("\n\n"),
  },
  {
    slug: "choosing-a-guardian",
    title: "Choosing the right guardian for your children",
    category: "Guardianship",
    excerpt:
      "The most consequential clause in most Wills is also the one people rush.",
    readingMinutes: 5,
    body: [
      "If both parents die while a child is under eighteen, someone must step into that role. If you have not named that person, a court will choose for you, on the evidence available to it.",
      "The instinct is to pick the closest relative. That is not always the right answer. Consider instead who shares your values, whose household has room, whose circumstances are stable, and who the child already trusts.",
      "Always name an alternate. Guardians move abroad, fall ill, or simply decline the responsibility when the moment comes.",
      "Finally, tell them. An appointment that arrives as a surprise during grief serves no one.",
    ].join("\n\n"),
  },
  {
    slug: "clauses-every-nigerian-will-should-include",
    title: "Five clauses every Nigerian Will should include",
    category: "Estate planning",
    excerpt:
      "Revocation, appointment, residue, attestation — and the one most people forget.",
    readingMinutes: 7,
    body: [
      "A Will is not a free-form letter. Certain clauses do specific legal work, and their absence causes predictable problems.",
      "First, the revocation clause. Without it, an earlier Will may be read alongside the new one, and contradictions are resolved by a court rather than by you.",
      "Second, the appointment of executors. Name at least two, and name a substitute.",
      "Third, the residuary clause. Specific gifts rarely exhaust an estate; the residue clause catches everything else, including assets acquired after the Will was signed.",
      "Fourth, the attestation clause. It records that the statutory signing formalities were observed, and it is what a registry looks for first.",
      "Fifth — the one most people forget — a clear statement of funeral wishes. It binds no one, but it spares a grieving family an argument.",
    ].join("\n\n"),
  },
];

async function seedPlans() {
  for (const plan of PLANS) {
    const [existing] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, plan.slug))
      .limit(1);
    if (existing) {
      console.log(`  · plan "${plan.slug}" already present`);
      continue;
    }
    await db.insert(plans).values({ id: newId(), ...plan });
    console.log(`  ✓ plan "${plan.slug}" created`);
  }
}

async function seedPosts() {
  for (const post of POSTS) {
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, post.slug))
      .limit(1);
    if (existing) {
      console.log(`  · article "${post.slug}" already present`);
      continue;
    }
    await db.insert(posts).values({ id: newId(), ...post });
    console.log(`  ✓ article "${post.slug}" created`);
  }
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "  · skipping admin — set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one",
    );
    return;
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    console.log(`  · admin "${email}" already present`);
    return;
  }

  await db.insert(users).values({
    id: newId(),
    email,
    name: "Castle Administrator",
    role: "admin",
    passwordHash: await hashPassword(password),
    emailVerifiedAt: new Date(),
  });
  console.log(`  ✓ admin "${email}" created`);
}

async function seedSettings() {
  const defaults: Array<{ key: string; value: unknown }> = [
    { key: "reviews.reminder_months", value: 12 },
    { key: "wills.require_solicitor_review", value: true },
    { key: "payments.default_provider", value: "paystack" },
    {
      // Placeholder until the client supplies real details. `getBankAccount()`
      // treats a missing account number as "not configured" and the UI says so
      // plainly rather than showing an account nobody can pay into.
      key: "payments.bank_account",
      value: {
        bankName: "",
        accountName: "Castle eWill and Trust Limited",
        accountNumber: "",
        instructions:
          "Quote your payment reference exactly as shown, or we cannot match your transfer.",
      },
    },
  ];

  for (const entry of defaults) {
    const [existing] = await db
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, entry.key))
      .limit(1);
    if (existing) continue;
    await db.insert(settings).values(entry);
    console.log(`  ✓ setting "${entry.key}" created`);
  }
}

async function main() {
  console.log("Seeding Castle eWill & Trust…\n");
  console.log("Plans:");
  await seedPlans();
  console.log("\nJournal:");
  await seedPosts();
  console.log("\nSettings:");
  await seedSettings();
  console.log("\nAdministrator:");
  await seedAdmin();
  console.log("\nDone.");
}

main()
  .then(async () => {
    await getPool().end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\nSeed failed:", error);
    await getPool().end().catch(() => undefined);
    process.exit(1);
  });
