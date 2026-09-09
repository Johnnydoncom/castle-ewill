"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  CreditCard,
  FolderLock,
  KeyRound,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Scroll,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useFormAction } from "@/hooks/use-api-form";
import { signOutAction } from "@/lib/actions/session";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  will: Scroll,
  wills: Scroll,
  documents: FolderLock,
  witnesses: Users,
  advisors: ShieldCheck,
  clients: Users,
  users: Users,
  identity: ShieldCheck,
  verifications: ShieldCheck,
  payments: CreditCard,
  pricing: Tags,
  messages: MessageSquare,
  posts: Newspaper,
  settings: Settings,
  admins: KeyRound,
};

export type ShellNavItem = {
  href: string;
  label: string;
  icon?: string;
};

type ShellProps = {
  nav: readonly ShellNavItem[];
  eyebrow: string;
  personName: string;
  personMeta: string;
  headerKicker: string;
  headerTitle: string;
  footer?: { title: string; body: string; cta: string; href?: string };
  children: React.ReactNode;
};

export function DashboardShell({
  nav,
  eyebrow,
  personName,
  personMeta,
  headerKicker,
  headerTitle,
  footer,
  children,
}: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /*
   * Restore the saved sidebar width after mount.
   *
   * `set-state-in-effect` is disabled here rather than worked around: the
   * value lives in `localStorage`, which does not exist while this renders on
   * the server, so seeding `useState` from it directly would render one width
   * on the server and another on the client and fail hydration. Reading it
   * after mount is the sanctioned exception the rule describes — an external
   * store being read into React — and the one extra render it costs is a
   * layout preference on an already-interactive page.
   */
  useEffect(() => {
    const saved = localStorage.getItem("castle_sidebar_collapsed");
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("castle_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Extract initials for user badge
  const initials = personName
    ? personName
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-30 flex-col border-r border-border/80 bg-background transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Header & Brand Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size={34} withWordmark={!collapsed} />
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-gold/10 hover:text-navy"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 text-gold" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-muted-foreground hover:text-navy" />
            )}
          </button>
        </div>

        {/* User badge */}
        <div className="border-b border-border/50 px-4 py-4">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-xl border border-gold/20 bg-gradient-to-r from-gold/5 via-gold/[0.02] to-transparent p-3 shadow-xs">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-serif text-sm font-semibold text-gold ring-2 ring-gold/40">
                {initials}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[9px] uppercase tracking-[0.3em] font-semibold text-gold">
                  {eyebrow}
                </p>
                <p className="truncate font-serif text-sm font-medium text-navy">
                  {personName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {personMeta}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center"
              title={`${eyebrow} ${personName} (${personMeta})`}
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-navy font-serif text-sm font-semibold text-gold ring-2 ring-gold/40 shadow-xs">
                {initials}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-none">
          {nav.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon ? ICON_MAP[n.icon] : undefined;
            return (
              <Link
                key={n.href}
                href={n.href}
                prefetch={false}
                title={collapsed ? n.label : undefined}
                className={`relative flex items-center rounded-xl transition-all duration-200 ${
                  collapsed
                    ? "justify-center p-3"
                    : "gap-3.5 px-3.5 py-2.5 text-sm"
                } ${
                  active
                    ? "bg-navy text-navy-foreground font-medium shadow-md shadow-navy/15"
                    : "text-muted-foreground hover:bg-gold/10 hover:text-navy"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold" />
                )}
                {Icon && (
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      active ? "text-gold" : "text-muted-foreground group-hover:text-navy"
                    }`}
                  />
                )}
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Counsel / Footer Card */}
        {footer && (
          <div className="border-t border-border/70 p-3">
            {!collapsed ? (
              <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-3.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 shrink-0 text-gold" />
                  <p className="font-serif text-[10px] uppercase tracking-[0.25em] font-semibold text-gold">
                    {footer.title}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-navy/90">
                  {footer.body}
                </p>
                <Link
                  href={footer.href ?? "/contact"}
                  prefetch={false}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-gold transition-colors underline underline-offset-4"
                >
                  {footer.cta} &rarr;
                </Link>
              </div>
            ) : (
              <div
                className="flex justify-center"
                title={`${footer.title}: ${footer.body}`}
              >
                <Link
                  href={footer.href ?? "/contact"}
                  prefetch={false}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-navy transition-colors"
                >
                  <Scale className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[82vw] max-w-xs flex-col overflow-y-auto bg-background shadow-elegant border-r border-border">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo size={32} />
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-border p-1.5 text-navy hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5 border-b border-border/60 bg-gold/5">
              <p className="font-serif text-[10px] uppercase tracking-[0.35em] font-semibold text-gold">
                {eyebrow}
              </p>
              <p className="mt-1 font-serif text-lg font-medium text-navy">
                {personName}
              </p>
              <p className="text-xs text-muted-foreground">{personMeta}</p>
            </div>

            <nav className="flex-1 space-y-1.5 px-3 py-4">
              {nav.map((n) => {
                const active = pathname === n.href;
                const Icon = n.icon ? ICON_MAP[n.icon] : undefined;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    prefetch={false}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-navy text-navy-foreground font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-navy"
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`h-5 w-5 ${
                          active ? "text-gold" : "text-muted-foreground"
                        }`}
                      />
                    )}
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </nav>

            {footer && (
              <div className="border-t border-border p-5">
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <p className="font-serif text-[10px] uppercase tracking-[0.3em] font-semibold text-gold">
                    {footer.title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-navy">
                    {footer.body}
                  </p>
                  <Link
                    href={footer.href ?? "/contact"}
                    prefetch={false}
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 inline-block text-xs font-medium text-navy underline underline-offset-4 hover:text-gold"
                  >
                    {footer.cta} &rarr;
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main Right-Side Content Wrapper */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        {/* Header Bar */}
        <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-10 lg:py-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              className="rounded-xl border border-border p-2 text-navy hover:bg-gold/10 hover:border-gold/40 transition-colors lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Desktop Sidebar Toggle Hamburger Button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center rounded-xl border border-border/80 p-2 text-navy hover:bg-gold/10 hover:border-gold/40 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4 text-navy" />
            </button>
          </div>

          <div className="min-w-0">
            <p className="truncate font-serif text-[10px] uppercase tracking-[0.35em] font-semibold text-gold">
              {headerKicker}
            </p>
            <p className="truncate font-serif text-sm font-medium text-navy">
              {headerTitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <SignOutForm />
          </div>
        </header>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-2.5 lg:hidden">
          {nav.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon ? ICON_MAP[n.icon] : undefined;
            return (
              <Link
                key={n.href}
                href={n.href}
                prefetch={false}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-navy bg-navy text-navy-foreground shadow-xs"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-gold" : "text-muted-foreground"
                    }`}
                  />
                )}
                <span>{n.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Sign-out form handler.
 */
function SignOutForm() {
  const [, action] = useFormAction(signOutAction);

  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-full bg-navy px-3.5 py-1.5 text-xs font-medium text-navy-foreground transition-colors hover:bg-navy/90 sm:px-4"
      >
        Sign out
      </button>
    </form>
  );
}
