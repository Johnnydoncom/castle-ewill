import type { Metadata } from "next";
import Link from "next/link";

import { listPublishedPosts } from "@/lib/actions/content";
import { REVIEW_TRIGGERS } from "@/lib/company";

/** Articles are database-backed; see the note in the pricing page. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estate planning resources",
  description:
    "Plain-English guidance on Wills, executors, guardianship and probate in Nigeria.",
};

export default async function ResourcesPage() {
  const posts = await listPublishedPosts();
  const [lead, ...rest] = posts;

  return (
    <>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-gold" />
            <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-gold">
              Estate planning resources
            </span>
          </div>
          <h1 className="max-w-3xl font-serif text-4xl text-navy sm:text-5xl lg:text-6xl">
            Notes on <span className="italic text-primary">legacy.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
            Estate planning explained without the jargon — what the law requires,
            what it does not, and where families most often come unstuck.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-20 text-center">
            <p className="font-serif text-lg text-navy">
              Articles are on their way.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code>npm run db:seed</code> to load the starter library.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {lead && (
              <Link
                href={`/blog/${lead.slug}`}
                className="group block border-t-2 border-gold pt-8"
              >
                <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                  {lead.category}
                </span>
                <h2 className="mt-4 max-w-3xl font-serif text-3xl leading-tight text-navy transition-colors group-hover:text-primary sm:text-4xl">
                  {lead.title}
                </h2>
                <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                  {lead.excerpt}
                </p>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {lead.reading_minutes} min read &rarr;
                </p>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid gap-x-10 gap-y-12 border-t border-border pt-12 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
                      {post.category}
                    </span>
                    <h3 className="mt-3 font-serif text-xl leading-snug text-navy transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {post.reading_minutes} min read
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-serif text-[10px] uppercase tracking-[0.35em] text-gold">
            When to review your Will
          </p>
          <h2 className="mt-3 font-serif text-3xl text-navy">
            Four moments worth a second look.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REVIEW_TRIGGERS.map((trigger) => (
              <div key={trigger.label} className="border-t border-gold/40 pt-5">
                <h3 className="font-serif text-lg text-navy">{trigger.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {trigger.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
