import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroFamily from "@/assets/hero-family.jpg";
import officeInterior from "@/assets/office-interior.jpg";
import advisorPortrait from "@/assets/advisor-portrait.jpg";
import legacyStill from "@/assets/legacy-still-life.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Castle eWill & Trust" },
      { name: "description", content: "The people, values and legal expertise behind Nigeria's premium online Will platform." },
      { property: "og:title", content: "About Castle eWill & Trust" },
      { property: "og:description", content: "Meet the team building Nigeria's premium online Will platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">About Castle</p>
          <h1 className="font-serif text-5xl leading-[1.05] text-navy sm:text-6xl lg:text-7xl">
            Legacy, made <span className="italic text-primary">honourable.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Castle was founded to bring dignity, clarity and technology to one of the most important conversations a family can have.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl shadow-elegant">
          <img src={heroFamily} alt="A Nigerian family at home" loading="lazy" className="h-[500px] w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h2 className="font-serif text-4xl text-navy">Our story</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Fewer than 5% of Nigerians die with a valid Will. The result is decades of family disputes, court delays, and
            wealth quietly lost. We started Castle because our own families had felt this — and because we knew the tools
            existed to solve it beautifully.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Castle blends practising Nigerian estate lawyers with world-class product design, so a Will that used to take
            weeks and cost hundreds of thousands can now be done in an afternoon — and still be entirely, unquestionably legal.
          </p>
        </div>
      </section>

      <section className="bg-navy-gradient py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-gold">Our values</p>
          <h2 className="text-center font-serif text-4xl sm:text-5xl">What we stand for</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              ["Dignity", "Every Nigerian deserves a beautiful, private way to plan their legacy — regardless of wealth."],
              ["Rigor", "We are lawyers first, technologists second. Every clause is drafted to withstand a Probate Registry."],
              ["Care", "We treat your Will the way we would treat our own — with quiet, meticulous attention."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <h3 className="font-serif text-2xl text-gold">{t}</h3>
                <p className="mt-3 text-sm text-navy-foreground/75">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Leadership</p>
          <h2 className="font-serif text-4xl text-navy sm:text-5xl">Guided by experts</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { image: advisorPortrait, name: "Barr. Emeka Okafor", role: "Head of Estate Practice", bio: "20+ years advising HNW families on succession and trusts." },
            { image: officeInterior, name: "Ngozi Bello, LL.M", role: "General Counsel", bio: "Former partner at a top-tier Lagos firm; probate specialist." },
            { image: legacyStill, name: "Tunde Ade", role: "Chief Product Officer", bio: "Built products for Africa's leading fintechs. Obsessed with craft." },
          ].map((p) => (
            <article key={p.name} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <img src={p.image} alt={p.name} loading="lazy" className="h-72 w-full object-cover" />
              <div className="p-6">
                <h3 className="font-serif text-xl text-navy">{p.name}</h3>
                <p className="mt-1 text-sm text-primary">{p.role}</p>
                <p className="mt-3 text-sm text-muted-foreground">{p.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-navy-gradient p-12 text-center text-navy-foreground shadow-elegant sm:p-16">
          <h2 className="font-serif text-4xl sm:text-5xl">Ready to write your Will?</h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-foreground/70">Join the thousands of Nigerian families protecting their legacy with Castle.</p>
          <Button size="lg" asChild className="mt-8 h-12 bg-gold-gradient px-8 font-semibold text-navy hover:opacity-90">
            <Link to="/">Start your Will<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
