import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { COMPANY } from "@/lib/company";

export function SiteFooter() {
  const cols = [
    {
      title: "Product",
      links: [
        ["Services", "/services"],
        ["Pricing", "/pricing"],
        ["FAQs", "/faqs"],
      ],
    },
    {
      title: "Company",
      links: [
        ["About", "/about"],
        ["Estate planning resources", "/blog"],
        ["Contact", "/contact"],
      ],
    },
    {
      title: "Legal",
      links: [
        ["Privacy Policy", "/privacy"],
        ["Terms of Service", "/terms"],
      ],
    },
  ] as const;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {COMPANY.business} in Nigeria. Prepare, update and securely store a
              legally compliant Will — anytime, anywhere.
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span className="leading-relaxed">
                  {COMPANY.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <a
                  href={COMPANY.phoneHref}
                  className="transition-colors hover:text-navy"
                >
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-colors hover:text-navy"
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-navy">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-navy"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {COMPANY.legalName} &middot; RC{" "}
            {COMPANY.rcNumber}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Registered in Nigeria &middot; Documents encrypted at rest
          </p>
        </div>
      </div>
    </footer>
  );
}
