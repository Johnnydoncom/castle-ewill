import type { Metadata } from "next";
import Link from "next/link";

import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Common questions about making a Will in Nigeria: legal validity, witnesses, executors, guardianship, cost, security and updates.",
};

type Faq = { q: string; a: string };
type Section = { title: string; faqs: Faq[] };

const SECTIONS: Section[] = [
  {
    title: "Making a Will",
    faqs: [
      {
        q: "Is a Will made on this platform legally binding?",
        a: "Yes, provided it is properly executed. The document we generate contains the clauses a valid Will requires — a declaration, revocation of earlier Wills, appointment of executors, disposition of the estate and an attestation clause. It becomes legally effective when you sign it in the simultaneous presence of two witnesses, who then sign in your presence. Until it is signed, it is a draft with no legal effect.",
      },
      {
        q: "Who can make a Will?",
        a: "Any person of full age — eighteen or over — who is of sound mind, memory and understanding. Our questionnaire will not proceed if the date of birth you enter puts you under eighteen.",
      },
      {
        q: "How long does it take?",
        a: "Most people finish the nine sections in fifteen to twenty-five minutes. You can save your progress at any point and return later; nothing is lost between sessions.",
      },
      {
        q: "What if I own property outside Nigeria?",
        a: "Immovable property is generally governed by the law of the country where it sits. If you hold land or a house abroad, tell us during drafting — in many cases a separate Will in that jurisdiction is the safer arrangement, and we will say so rather than let one document create a conflict.",
      },
    ],
  },
  {
    title: "Witnesses and executors",
    faqs: [
      {
        q: "Can a beneficiary be a witness?",
        a: "No. A gift to an attesting witness — or to that witness's spouse — is void, even though the Will itself remains valid. Our builder blocks this combination in both directions: it will not let you add a witness who is already a beneficiary, nor a beneficiary who is already a witness.",
      },
      {
        q: "How many witnesses do I need?",
        a: "Two. Both must be present at the same time when you sign, and both must then sign in your presence. A witness should be an adult of sound mind who is not inheriting under the Will.",
      },
      {
        q: "Can a beneficiary be an executor?",
        a: "Yes. It is common and perfectly lawful for a spouse or adult child to serve as executor while also inheriting. The restriction applies to witnesses, not executors.",
      },
      {
        q: "How many executors should I appoint?",
        a: "We recommend at least two, plus an alternate. Executors move abroad, fall ill, or decline the role when the moment arrives, and an estate with no one willing to act must go back to court.",
      },
    ],
  },
  {
    title: "Children and guardianship",
    faqs: [
      {
        q: "Do I need to appoint a guardian?",
        a: "If you have children under eighteen, yes. Without an appointed guardian, a court decides who raises your children on whatever evidence is in front of it. If you have no minor children, our builder skips the section entirely.",
      },
      {
        q: "Should I tell the guardian I have named them?",
        a: "Please do. An appointment that arrives as a surprise during grief serves nobody. Naming an alternate is equally important.",
      },
    ],
  },
  {
    title: "Security and privacy",
    faqs: [
      {
        q: "How are my documents protected?",
        a: "Every document you upload is encrypted with AES-256-GCM before it leaves our servers, so our storage provider only ever holds ciphertext. Each download re-verifies the file against a checksum recorded at upload, so an altered file fails rather than reaching you.",
      },
      {
        q: "Who can see my Will?",
        a: "You, and the reviewers you ask to look at it. Confidentiality is one of our core values and our charter forbids us from misusing personal information or disclosing it beyond what you have instructed.",
      },
      {
        q: "Should I email you my documents?",
        a: `Please do not. Email is not a secure channel for identity documents or title deeds. Upload them to your encrypted vault instead. If you need to reach us about a document, call ${COMPANY.phone} and reference it by name.`,
      },
    ],
  },
  {
    title: "Cost and updates",
    faqs: [
      {
        q: "Is this a subscription?",
        a: "No. You pay once. Transparency is one of our stated values, and a renewal charge nobody expected is the opposite of that.",
      },
      {
        q: "Can I change my Will later?",
        a: "Yes. Log in, revise the relevant section and re-sign the new document with two witnesses. Each version is recorded with its own document number and revision history.",
      },
      {
        q: "How often should I review it?",
        a: "Every twelve months as a matter of routine, and after any marriage, birth of a child, or acquisition of significant property. Marriage in particular can revoke a Will made beforehand. We will remind you.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              Frequently asked
            </span>
          </div>
          <h1 className="max-w-3xl font-serif text-4xl text-navy sm:text-5xl lg:text-6xl">
            Questions, <span className="italic text-primary">answered plainly.</span>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-14">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-6 border-b border-border pb-3 font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
                {section.title}
              </h2>
              <div className="divide-y divide-border">
                {section.faqs.map((faq) => (
                  <details key={faq.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-serif text-lg leading-snug text-navy">
                      {faq.q}
                      <span
                        aria-hidden
                        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-border text-navy transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-3xl pr-12 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border border-border bg-surface p-8 text-center">
          <h2 className="font-serif text-2xl text-navy">
            Still have a question?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We would rather answer it now than have you guess. Call{" "}
            {COMPANY.phone} or send us a message.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block bg-navy px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90"
          >
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}
