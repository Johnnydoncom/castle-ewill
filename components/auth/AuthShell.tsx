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
  plateNumber: string;
}

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
  plateImage,
  plateCaption,
  plateNumber,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Left: Editorial plate */}
        <aside className="relative hidden overflow-hidden bg-navy text-navy-foreground lg:block">
          <div className="absolute inset-0">
            <Image
              src={plateImage}
              alt=""
              fill
              className="object-cover opacity-40"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/85 to-navy/60" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex items-center justify-between">
              <Logo variant="light" />
              <div className="flex items-center gap-3 font-serif text-xs uppercase tracking-[0.3em] text-gold">
                <span className="h-px w-8 bg-gold/60" />
                Plate {plateNumber}
              </div>
            </div>

            <div className="max-w-md space-y-6">
              <div className="h-px w-16 bg-gold" />
              <p className="font-serif text-xs uppercase tracking-[0.35em] text-gold">
                Will Papers &middot; Vol. I
              </p>
              <h2 className="font-serif text-4xl leading-[1.05] tracking-tight">
                Your legacy,{" "}
                <span className="italic text-gold">carefully</span> preserved.
              </h2>
              <p className="text-sm leading-relaxed text-navy-foreground/75">
                Every will drafted here is reviewed by admitted Nigerian counsel,
                stored under bank-grade encryption, and sealed with witnesses in
                accordance with the Wills Act.
              </p>
            </div>

            <div className="flex items-end justify-between border-t border-navy-foreground/15 pt-6">
              <div>
                <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold/80">
                  Caption
                </p>
                <p className="mt-1 max-w-xs text-xs italic leading-relaxed text-navy-foreground/70">
                  {plateCaption}
                </p>
              </div>
              <p className="font-serif text-xs tracking-[0.3em] text-navy-foreground/50">
                &sect; {plateNumber}
              </p>
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <main className="flex flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 py-5 lg:px-10">
            <Link href="/" className="lg:hidden">
              <Logo size={32} />
            </Link>
            <div className="hidden lg:block">
              <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Castle eWill &amp; Trust
              </p>
            </div>
            <Link
              href="/"
              className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-navy"
            >
              &larr; Return home
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
