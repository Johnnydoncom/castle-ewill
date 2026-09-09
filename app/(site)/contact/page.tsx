import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/site/ContactForm";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: `Speak with ${COMPANY.legalName}. Call ${COMPANY.phone} or write to ${COMPANY.email}.`,
};

export default function ContactPage() {
  return (
    <>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              Contact
            </span>
          </div>
          <h1 className="max-w-2xl font-serif text-4xl text-navy sm:text-5xl lg:text-6xl">
            We would be glad to{" "}
            <span className="italic text-primary">hear from you.</span>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-10">
            <div>
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Registered office
              </p>
              <ul className="mt-5 space-y-5 text-sm">
                <li className="flex gap-4">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span className="leading-relaxed text-navy/85">
                    {COMPANY.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                </li>
                <li className="flex gap-4">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <a
                    href={COMPANY.phoneHref}
                    className="text-navy/85 underline-offset-4 transition-colors hover:text-navy hover:underline"
                  >
                    {COMPANY.phone}
                  </a>
                </li>
                <li className="flex gap-4">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-navy/85 underline-offset-4 transition-colors hover:text-navy hover:underline"
                  >
                    {COMPANY.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t border-border pt-8">
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Company particulars
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Registered name</dt>
                  <dd className="text-navy">{COMPANY.legalName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">RC number</dt>
                  <dd className="text-navy">{COMPANY.rcNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nature of business</dt>
                  <dd className="text-navy">{COMPANY.business}</dd>
                </div>
              </dl>
            </div>

            <div className="border-l-2 border-gold/40 bg-gold/5 px-5 py-4">
              <p className="text-sm leading-relaxed text-navy/80">
                Please do not send confidential documents by email. Once you have
                an account, upload them to your encrypted vault instead.
              </p>
            </div>
          </div>

          <div className="border border-border bg-surface p-8 lg:p-10">
            <h2 className="font-serif text-2xl text-navy">Send a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We aim to respond within one working day.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
