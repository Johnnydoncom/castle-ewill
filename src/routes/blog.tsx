import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Link } from "@tanstack/react-router";
import fatherDaughter from "@/assets/father-daughter.jpg";
import legacyStill from "@/assets/legacy-still-life.jpg";
import signingHands from "@/assets/signing-hands.jpg";
import advisorPortrait from "@/assets/advisor-portrait.jpg";
import officeInterior from "@/assets/office-interior.jpg";
import heroFamily from "@/assets/hero-family.jpg";

const posts = [
  { image: fatherDaughter, tag: "Guardianship", title: "Choosing the right guardian for your children", excerpt: "The single most important decision Nigerian parents can make — and how to think it through." },
  { image: legacyStill, tag: "Wills 101", title: "What happens if you die without a Will in Nigeria?", excerpt: "A plain-English guide to intestate succession under the Administration of Estates Law." },
  { image: signingHands, tag: "Estate planning", title: "5 clauses every Nigerian Will should include", excerpt: "From residuary gifts to survivorship, the small clauses that make a big difference." },
  { image: advisorPortrait, tag: "Interview", title: "In conversation with Barr. Emeka Okafor", excerpt: "20 years of estate practice, distilled into one candid conversation." },
  { image: officeInterior, tag: "Trust structures", title: "Living trusts vs. testamentary trusts", excerpt: "Which structure protects your family — and your privacy — best?" },
  { image: heroFamily, tag: "Family", title: "How to talk to your family about your Will", excerpt: "A short, gentle guide to a conversation most Nigerian families avoid." },
];

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Castle eWill & Trust" },
      { name: "description", content: "Estate planning insights, guides and stories from Castle's Nigerian legal team." },
      { property: "og:title", content: "Castle Blog" },
      { property: "og:description", content: "Estate planning insights for Nigerian families." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Journal</p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">
            Notes on <span className="italic text-primary">legacy.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Insights from our lawyers and advisors on Wills, trusts and Nigerian estate practice.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.title} to="/blog" className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant">
              <div className="relative h-56 overflow-hidden">
                <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">{p.tag}</span>
                <h2 className="mt-2 font-serif text-xl text-navy group-hover:text-primary">{p.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
