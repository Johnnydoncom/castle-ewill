import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Overview", numeral: "I" },
  { to: "/wills/new", label: "Will Builder", numeral: "II" },
  { to: "/dashboard", label: "Documents", numeral: "III" },
  { to: "/dashboard", label: "Witnesses", numeral: "IV" },
  { to: "/dashboard", label: "Advisors", numeral: "V" },
  { to: "/dashboard", label: "Settings", numeral: "VI" },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background lg:flex">
          <div className="border-b border-border px-6 py-5">
            <Logo size={32} />
          </div>
          <div className="px-6 py-6">
            <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
              Chambers of
            </p>
            <p className="mt-1 font-serif text-lg text-navy">Ada Okafor</p>
            <p className="text-xs text-muted-foreground">Testator · Member since 2026</p>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {nav.map((n, i) => {
              const active = i === 0 ? pathname === "/dashboard" : pathname === n.to;
              return (
                <Link
                  key={n.numeral}
                  to={n.to}
                  className={`group flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-navy text-navy-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-navy"
                  }`}
                >
                  <span
                    className={`font-serif text-[10px] uppercase tracking-[0.25em] ${
                      active ? "text-gold" : "text-muted-foreground/60"
                    }`}
                  >
                    {n.numeral}
                  </span>
                  <span className="font-medium">{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-6">
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                Counsel available
              </p>
              <p className="mt-2 text-xs leading-relaxed text-navy">
                Book a 20-minute review with a Nigerian estate lawyer.
              </p>
              <button className="mt-3 text-xs font-medium text-navy underline underline-offset-4 hover:text-gold">
                Reserve time →
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Will Papers · Vol. I
              </p>
              <p className="font-serif text-sm text-navy">Private Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-navy hover:bg-muted">
                Search
              </button>
              <Link
                to="/"
                className="rounded-full bg-navy px-4 py-1.5 text-xs font-medium text-navy-foreground hover:bg-navy/90"
              >
                Sign out
              </Link>
            </div>
          </header>
          <main className="px-6 py-10 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
