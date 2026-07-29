import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import signingHands from "@/assets/signing-hands.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Castle eWill & Trust" },
      {
        name: "description",
        content:
          "Sign in to your Castle eWill & Trust account to draft, review, or update your Will.",
      },
      { property: "og:title", content: "Sign in — Castle eWill & Trust" },
      {
        property: "og:description",
        content: "Access your secure Will dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthShell
      eyebrow="Folio I · Sign In"
      title={
        <>
          Welcome back to your{" "}
          <span className="italic text-gold">chambers.</span>
        </>
      }
      intro="Enter your credentials to resume drafting, review pending signatures, or access sealed documents."
      plateImage={signingHands}
      plateNumber="I"
      plateCaption="A signature is a promise made permanent. Yours is safeguarded."
      footer={
        <>
          New to Castle?{" "}
          <Link
            to="/register"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Open an account →
          </Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@domain.com"
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          hint={
            <Link
              to="/forgot-password"
              className="text-muted-foreground hover:text-navy"
            >
              Forgot?
            </Link> as unknown as string
          }
        />

        <label className="flex items-center gap-3 pt-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-navy focus:ring-gold"
          />
          Keep me signed in on this device
        </label>

        <Button
          type="submit"
          className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
          size="lg"
          asChild
        >
          <Link to="/dashboard">Sign in to dashboard</Link>
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-navy transition-colors hover:bg-muted"
        >
          Continue with Google
        </button>
      </form>
    </AuthShell>
  );
}
