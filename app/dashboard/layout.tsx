import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCustomer } from "@/lib/actions/guards";

/** Per-user data throughout — never prerendered, never cached across requests. */
export const dynamic = "force-dynamic";

const nav = [
  /*
   * Organised around the Will, because that is the object clients think in and
   * they may hold several.
   *
   * "Witnesses" and "Advisors" are gone. Both were properties of one Will
   * wearing the costume of a destination: witnesses duplicated wizard step
   * eight, advisors showed a single Will's review status. With more than one
   * Will neither had an answer to "whose?", and both quietly picked one for
   * you. They live on the Will now.
   *
   * Documents stays top-level: identity documents and the passport photograph
   * belong to the *person*, not to any one Will. Billing stays too, narrowed
   * to what is genuinely account-level — the subscription and the receipts.
   * Paying for a Will happens on that Will.
   */
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/dashboard/wills", label: "My Wills", icon: "will" },
  { href: "/dashboard/documents", label: "Documents", icon: "documents" },
  { href: "/dashboard/payments", label: "Billing", icon: "payments" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomer();

  /*
   * The sidebar footer once read "Book a 20-minute review with a Nigerian
   * estate lawyer / Reserve time". Two things were wrong with it: there is no
   * booking system behind the link — it goes to the contact form — and the
   * solicitor review actually sold is a lawyer *reading the Will and writing
   * back*, not a scheduled call of a stated length. Promising a slot nothing
   * can allocate is the same fault as the invented client on the homepage.
   */
  return (
    <DashboardShell
      nav={nav}
      eyebrow="Signed in as"
      personName={user.name}
      personMeta={user.email}
      headerKicker="Castle eWill & Trust"
      headerTitle="Private Dashboard"
      footer={{
        title: "Want a second opinion?",
        body: "A Nigerian solicitor can read your Will clause by clause and write back. It is an optional paid extra.",
        cta: "Ask about a review",
        href: "/contact",
      }}
    >
      {children}
    </DashboardShell>
  );
}
