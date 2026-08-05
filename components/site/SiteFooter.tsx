import Link from "next/link";
import { ArrowRight, Lock, Scale, Clock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { COMPANY } from "@/lib/company";

const cols = [
  {
    title: "Platform",
    links: [
      ["Services", "/services"],
      ["Pricing", "/pricing"],
      ["Start your Will", "/register"],
      ["Sign in", "/login"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About us", "/about"],
      ["Security & verification", "/security"],
      ["The Journal", "/blog"],
      ["Contact", "/contact"],
      ["FAQs", "/faqs"],
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

const assurances = [
  [Scale, "Nigerian Wills Act compliant"],
  [Lock, "AES-256 encrypted vault"],
  [Clock, "Ready in about 20 minutes"],
] as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy text-navy-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(800px 400px at 85% -20%, color-mix(in oklab, var(--primary) 26%, transparent), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -bottom-32 select-none font-serif text-[26rem] leading-none text-gold/[0.04]"
      >
        C
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA band */}
        <div className="grid gap-8 border-b border-white/10 py-14 lg:grid-cols-[1.4fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
              Begin today
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-3xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              Put your wishes in writing,
              <br />
              <span className="italic text-gold">while it is still easy.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-navy transition-all hover:shadow-gold"
            >
              Start your Will
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-white/25 px-7 py-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-navy-foreground/85 transition-colors hover:border-gold/60 hover:text-gold"
            >
              Talk to an advisor
            </Link>
          </div>
        </div>

        {/* Assurance rail */}
        <div className="grid gap-6 border-b border-white/10 py-8 sm:grid-cols-3">
          {assurances.map(([Icon, label]) => (
            <div key={label} className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/40">
                <Icon className="h-4 w-4 text-gold" />
              </span>
              <span className="min-w-0 text-sm text-navy-foreground/75">{label}</span>
            </div>
          ))}
        </div>

        {/* Directory */}
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-5">
            <Logo variant="light" />
            <p className="max-w-xs text-sm leading-relaxed text-navy-foreground/65">
              {COMPANY.name} is Nigeria&rsquo;s premium online Will making house —
              built with practising solicitors, designed for families.
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-navy-foreground/40">
              Lagos · Abuja · Port Harcourt
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="mb-5 font-serif text-[11px] uppercase tracking-[0.28em] text-gold">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-navy-foreground/65 transition-colors hover:text-gold"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 py-8 sm:flex-row sm:items-center">
          <p className="text-xs text-navy-foreground/45">
            © {new Date().getFullYear()} <Link href="/">{COMPANY.name}</Link>. All rights reserved.
          </p>
          <p className="text-xs text-navy-foreground/45">
            Castle is not a law firm; documents are reviewed by independent Nigerian solicitors.
          </p>
        </div>
      </div>
    </footer>
  );
}

// import { Mail, MapPin, Phone } from "lucide-react";

// import { Logo } from "@/components/brand/Logo";
// import { COMPANY } from "@/lib/company";

// export function SiteFooter() {
//   const cols = [
//     {
//       title: "Product",
//       links: [
//         ["Services", "/services"],
//         ["Pricing", "/pricing"],
//         ["FAQs", "/faqs"],
//       ],
//     },
//     {
//       title: "Company",
//       links: [
//         ["About", "/about"],
//         ["Estate planning resources", "/blog"],
//         ["Contact", "/contact"],
//       ],
//     },
//     {
//       title: "Legal",
//       links: [
//         ["Privacy Policy", "/privacy"],
//         ["Terms of Service", "/terms"],
//       ],
//     },
//   ] as const;

//   return (
//     <footer className="border-t border-border bg-surface">
//       <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
//         <div className="grid gap-10 md:grid-cols-4">
//           <div className="space-y-5">
//             <Logo />
//             <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
//               {COMPANY.business} in Nigeria. Prepare, update and securely store a
//               legally compliant Will — anytime, anywhere.
//             </p>
//             <ul className="space-y-2.5 text-sm text-muted-foreground">
//               <li className="flex gap-3">
//                 <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
//                 <span className="leading-relaxed">
//                   {COMPANY.addressLines.map((line) => (
//                     <span key={line} className="block">
//                       {line}
//                     </span>
//                   ))}
//                 </span>
//               </li>
//               <li className="flex gap-3">
//                 <Phone className="h-4 w-4 shrink-0 text-gold" />
//                 <a
//                   href={COMPANY.phoneHref}
//                   className="transition-colors hover:text-navy"
//                 >
//                   {COMPANY.phone}
//                 </a>
//               </li>
//               <li className="flex gap-3">
//                 <Mail className="h-4 w-4 shrink-0 text-gold" />
//                 <a
//                   href={`mailto:${COMPANY.email}`}
//                   className="transition-colors hover:text-navy"
//                 >
//                   {COMPANY.email}
//                 </a>
//               </li>
//             </ul>
//           </div>

//           {cols.map((col) => (
//             <div key={col.title}>
//               <h4 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-navy">
//                 {col.title}
//               </h4>
//               <ul className="space-y-3">
//                 {col.links.map(([label, href]) => (
//                   <li key={href}>
//                     <Link
//                       href={href}
//                       className="text-sm text-muted-foreground transition-colors hover:text-navy"
//                     >
//                       {label}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
//           <p className="text-xs text-muted-foreground">
//             &copy; {new Date().getFullYear()} {COMPANY.legalName} &middot; RC{" "}
//             {COMPANY.rcNumber}. All rights reserved.
//           </p>
//           <p className="text-xs text-muted-foreground">
//             Registered in Nigeria &middot; Documents encrypted at rest
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }


