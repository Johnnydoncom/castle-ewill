"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, MailCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";


/** Public navigation, per the client brief's Public Website list. */
const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faqs", label: "FAQs" },
  { href: "/blog", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      {/* Announcement rail */}
      <div className="hidden bg-navy text-navy-foreground md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 text-[11px] tracking-[0.14em] sm:px-6 lg:px-8">
          <a href="mailto:info@castlewilltrust.com" target="_blank" className="inline-flex items-center gap-2 uppercase text-navy-foreground/70">
            <MailCheck className="h-3.5 w-3.5 text-gold" />
            info@castlewilltrust.com
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 uppercase text-gold transition-opacity hover:opacity-80"
          >
            Speak to an advisor
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <header
        className={`border-b transition-all duration-300 ${scrolled
          ? "border-border/70 bg-background/85 shadow-soft backdrop-blur-xl"
          : "border-transparent bg-background"
          }`}
      >
        <div
          className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8 ${scrolled ? "h-16" : "h-20"
            }`}
        >
          <Logo />

          <div className="flex items-center gap-2">
            <nav className="mr-2 hidden items-center lg:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`group relative px-3.5 py-2 text-[14px] font-medium text-muted-foreground transition-colors hover:text-navy ${pathname === n.href ? "text-navy" : ""
                    }`}
                >
                  {n.label}
                  <span className="pointer-events-none absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>

            <Link
              href="/login"
              className="hidden h-11 items-center rounded-full px-5 text-[14px] font-semibold text-navy transition-colors hover:bg-muted md:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group hidden h-11 items-center gap-2 rounded-full bg-navy px-6 text-[14px] font-semibold text-navy-foreground transition-all hover:shadow-elegant md:inline-flex"
            >
              Start your Will
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-navy md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Desktop overflow nav for md screens */}
        <nav className="hidden border-t border-border/60 md:flex lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6 py-2.5">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap text-[14px] font-medium text-muted-foreground hover:text-navy ${pathname === n.href ? "text-navy" : ""
                  }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {open && (
        <div className="border-b border-border bg-background md:hidden">
          <div className="px-4 py-4">
            <div className="divide-y divide-border/70">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3.5 font-serif text-lg text-navy"
                >
                  {n.label}
                  <ArrowRight className="h-4 w-4 text-gold" />
                </Link>
              ))}
            </div>
            <div className="mt-5 grid gap-2">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-full bg-navy text-sm font-semibold text-navy-foreground"
              >
                Start your Will
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold text-navy"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
