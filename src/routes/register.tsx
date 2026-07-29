import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import legacyStill from "@/assets/legacy-still-life.jpg";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Open an account — Castle eWill & Trust" },
      {
        name: "description",
        content:
          "Create a Castle eWill & Trust account and begin drafting your legally-sound Will in minutes.",
      },
      { property: "og:title", content: "Open an account — Castle eWill & Trust" },
      {
        property: "og:description",
        content: "Begin your Will with Nigeria's premium succession platform.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Folio II · Enrolment"
      title={
        <>
          Open the ledger on your{" "}
          <span className="italic text-gold">legacy.</span>
        </>
      }
      intro="Three fields and you are on your way to a signed, witnessed, and sealed Will. No credit card required to begin."
      plateImage={legacyStill}
      plateNumber="II"
      plateCaption="A brass key. A folded letter. The small artefacts of a life, entrusted forward."
      footer={
        <>
          Already enrolled?{" "}
          <Link
            to="/login"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Sign in →
          </Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-6">
          <AuthField id="first" label="First name" placeholder="Ada" />
          <AuthField id="last" label="Surname" placeholder="Okafor" />
        </div>
        <AuthField
          id="email"
          label="Email"
          type="email"
          placeholder="you@domain.com"
          autoComplete="email"
        />
        <AuthField
          id="phone"
          label="Phone"
          type="tel"
          placeholder="+234 800 000 0000"
          hint="For witness coordination"
        />
        <AuthField
          id="password"
          label="Create password"
          type="password"
          placeholder="At least 10 characters"
          autoComplete="new-password"
        />

        <label className="flex items-start gap-3 pt-1 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border text-navy focus:ring-gold"
          />
          <span>
            I accept the{" "}
            <Link to="/terms" className="text-navy underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-navy underline underline-offset-2">
              Privacy Policy
            </Link>
            , and consent to encrypted storage of my Will documents.
          </span>
        </label>

        <Button
          type="submit"
          className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
          size="lg"
          asChild
        >
          <Link to="/dashboard">Create account · Begin drafting</Link>
        </Button>

        <p className="text-center text-[11px] italic text-muted-foreground">
          By continuing, a verification code will be dispatched to your email.
        </p>
      </form>
    </AuthShell>
  );
}
