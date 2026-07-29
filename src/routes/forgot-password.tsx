import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import advisorPortrait from "@/assets/advisor-portrait.jpg";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Castle eWill & Trust" },
      {
        name: "description",
        content:
          "Recover access to your Castle eWill & Trust account with a secure reset link.",
      },
      { property: "og:title", content: "Reset password — Castle eWill & Trust" },
      {
        property: "og:description",
        content: "Secure account recovery for your Will dashboard.",
      },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <AuthShell
      eyebrow="Folio III · Recovery"
      title={
        <>
          Lost the key to your{" "}
          <span className="italic text-gold">chambers?</span>
        </>
      }
      intro="Enter the email on file. We will dispatch a single-use recovery link, sealed and time-bound to sixty minutes."
      plateImage={advisorPortrait}
      plateNumber="III"
      plateCaption="Counsel stands by. A reset issued here reaches you within moments."
      footer={
        <>
          Remembered it after all?{" "}
          <Link
            to="/login"
            className="font-medium text-navy underline underline-offset-4 hover:text-gold"
          >
            Back to sign in →
          </Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <AuthField
          id="email"
          label="Email on file"
          type="email"
          placeholder="you@domain.com"
          autoComplete="email"
        />

        <Button
          type="submit"
          className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
          size="lg"
        >
          Dispatch recovery link
        </Button>

        <div className="rounded-lg border border-border bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-navy">
            Note from counsel
          </p>
          <p className="mt-2">
            For your protection, we never reveal whether an email is registered.
            If a match is found, the link will arrive shortly.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
