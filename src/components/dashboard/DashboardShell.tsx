import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export type ShellNavItem = {
  to: string;
  label: string;
  numeral: string;
};

type ShellProps = {
  nav: readonly ShellNavItem[];
  eyebrow: string;
  personName: string;
  personMeta: string;
  headerKicker: string;
  headerTitle: string;
  footer?: { title: string; body: string; cta: string };
};

export function DashboardShell({
  nav,
  eyebrow,
  personName,
  personMeta,
  headerKicker,
  headerTitle,
  footer,
}: ShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const sidebar = (
    <>
      <div className="border-b border-border px-6 py-5">
        <Logo size={32} />
      </div>
      <div className="px-6 py-6">
        <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
          {eyebrow}
        </p>
        <p className="mt-1 font-serif text-lg text-navy">{personName}</p>
        <p className="text-xs text-muted-foreground">{personMeta}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-navy text-navy-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-navy"
              }`}
            >
              <span
                className={`w-6 shrink-0 font-serif text-[10px] uppercase tracking-[0.25em] ${
                  active ? "text-gold" : "text-muted-foreground/60"
                }`}
              >
                {n.numeral}
              </span>
              <span className="truncate font-medium">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {footer && (
        <div className="border-t border-border p-6">
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
            <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {footer.title}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-navy">{footer.body}</p>
            <button className="mt-3 text-xs font-medium text-navy underline underline-offset-4 hover:text-gold">
              {footer.cta} →
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background lg:flex">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[82vw] max-w-xs flex-col overflow-y-auto bg-background shadow-elegant">
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-5 rounded-full border border-border p-1.5 text-navy"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-10 lg:py-4">
            <button
              className="rounded-full border border-border p-2 text-navy lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate font-serif text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                {headerKicker}
              </p>
              <p className="truncate font-serif text-sm text-navy">{headerTitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button className="hidden rounded-full border border-border px-4 py-1.5 text-xs font-medium text-navy hover:bg-muted sm:block">
                Search
              </button>
              <Link
                to="/"
                className="rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-navy-foreground hover:bg-navy/90 sm:px-4"
              >
                Sign out
              </Link>
            </div>
          </header>

          {/* Mobile section tabs */}
          <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-3 lg:hidden">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-navy bg-navy text-navy-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>

          <main className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
