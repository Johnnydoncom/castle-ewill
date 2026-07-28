import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

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
        ["Blog", "/blog"],
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
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Nigeria's premium online Will making platform. Protect your legacy in minutes.
            </p>
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
                      to={href}
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
            © {new Date().getFullYear()} Castle eWill & Trust. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made in Nigeria · Bank-grade encryption · Legally reviewed
          </p>
        </div>
      </div>
    </footer>
  );
}
