import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import officeInterior from "@/assets/office-interior.jpg";

const groups = [
  {
    title: "Getting started",
    faqs: [
      ["Is a Will created on Castle legally binding in Nigeria?", "Yes. Every Will is drafted in line with the Wills Act and reviewed by qualified Nigerian estate lawyers. Once signed and witnessed correctly, it is fully binding."],
      ["Who can create a Will on Castle?", "Any Nigerian resident aged 18 or older with legal capacity may create a Will on Castle."],
      ["How long does it take?", "Most clients finish in 15–20 minutes. You can save progress and return anytime."],
    ],
  },
  {
    title: "Security & privacy",
    faqs: [
      ["How secure is my data?", "We use AES-256 encryption, audited infrastructure and strict access controls — the same standards as leading banks."],
      ["Who can see my Will?", "Only you. Not even our lawyers can access your Will without your explicit request or your death being verified."],
      ["What happens if Castle shuts down?", "Your documents are held in escrow with an independent legal partner and remain accessible to you."],
    ],
  },
  {
    title: "After you sign",
    faqs: [
      ["Can I update my Will later?", "Yes — unlimited updates on Family and Estate plans. Simply log in, revise and re-sign."],
      ["How do my executors find my Will?", "You designate executors during the wizard. Castle can notify them (with your consent) upon a verified death."],
      ["Do I need to register my Will?", "Registration at a Probate Registry is optional but recommended. We can guide you through the process."],
    ],
  },
];

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — Castle eWill & Trust" },
      { name: "description", content: "Answers to common questions about creating a legally-binding Will in Nigeria." },
      { property: "og:title", content: "Castle FAQs" },
      { property: "og:description", content: "Common questions about Nigerian Wills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FAQsPage,
});

function FAQsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <img src={officeInterior} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">FAQs</p>
          <h1 className="font-serif text-5xl text-navy-foreground sm:text-6xl">
            Answers, <span className="italic text-gold">clearly given.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-foreground/70">
            Everything you need to know before creating your Will with Castle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {groups.map((g) => (
          <div key={g.title} className="mb-12">
            <h2 className="mb-6 font-serif text-3xl text-navy">{g.title}</h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {g.faqs.map(([q, a]) => (
                <details key={q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-navy">
                    {q}
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-navy transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
