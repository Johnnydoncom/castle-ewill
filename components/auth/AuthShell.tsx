import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";
import type { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
  plateImage: string;
  plateCaption: string;
}

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
  plateImage,
  plateCaption,
}: AuthShellProps) {
  return (
    /*
     * On large screens the two columns scroll independently: the plate is
     * pinned to the viewport and the form column carries the overflow. The
     * container is `h-screen overflow-hidden` so the page itself never
     * scrolls — otherwise the plate's background image would slide away as
     * a long form (registration is the tallest) pushed the document down.
     *
     * Below `lg` the plate is not rendered at all, so the form column falls
     * back to ordinary document scrolling.
     */
    <div className="bg-background lg:grid lg:h-screen lg:grid-cols-[1.05fr_1fr] lg:overflow-hidden">
      {/* Left: Editorial plate — fixed, never scrolls */}
      <aside className="relative hidden overflow-hidden bg-navy text-navy-foreground lg:block lg:h-screen">
        <div className="absolute inset-0">
          <Image
            src={plateImage}
            alt="Sign in to your account"
            loading="eager"
            fill
            className="object-cover opacity-40"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/85 to-navy/60" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center justify-between">
            <Logo linked={false} variant="light" />
            <div className="flex items-center gap-3 font-serif text-xs uppercase tracking-[0.3em] text-gold">
              <span className="h-px w-8 bg-gold/60" />
              RC 9701348
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <div className="h-px w-16 bg-gold" />
            <p className="font-serif text-xs uppercase tracking-[0.35em] text-gold">
              Castle eWill &amp; Trust
            </p>
            <h2 className="font-serif text-4xl leading-[1.05] tracking-tight">
              Your legacy,{" "}
              <span className="italic text-gold">carefully</span> preserved.
            </h2>
            {/*
                * Review is an optional extra — included with Premium,
                * chargeable on Basic — so it is offered here rather than
                * promised. The encryption and witnessing claims are
                * unconditional and stay as they were.
                */}
            <p className="text-sm leading-relaxed text-navy-foreground/75">
              Every Will drafted here is stored under bank-grade encryption
              and sealed with witnesses in compliance with the law,
              with admitted Nigerian counsel to review it whenever you
              want one.
            </p>
          </div>

          <div className="border-t border-navy-foreground/15 pt-6">
            <p className="max-w-xs text-xs italic leading-relaxed text-navy-foreground/70">
              {plateCaption}
            </p>
          </div>
        </div>
      </aside>

      {/* Right: Form */}
      {/* Right: the form — the only column that scrolls */}
      <main className="flex min-h-screen flex-col lg:h-screen lg:min-h-0 lg:overflow-y-auto">
        {/*
            * `min-h-0` matters: a flex child defaults to `min-height: auto`,
            * which refuses to shrink below its content and so would push the
            * overflow back out to the document instead of scrolling here.
            */}
        <header className="z-10 flex items-center justify-between bg-background px-6 py-5 lg:px-10">
          <Link href="/" className="lg:hidden">
            <Logo size={32} linked={false} />
          </Link>


        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-8 bg-gold" />
              <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
                {eyebrow}
              </p>
            </div>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-navy">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {intro}
            </p>

            <div className="mt-10">{children}</div>

            <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
              {footer}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  id,
  type = "text",
  placeholder,
  hint,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="font-serif text-[10px] uppercase tracking-[0.3em] text-navy"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] italic text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-lg text-navy placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none focus:ring-0"
      />
    </div>
  );
}
