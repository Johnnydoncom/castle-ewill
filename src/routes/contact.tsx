import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import officeInterior from "@/assets/office-interior.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Castle eWill & Trust" },
      { name: "description", content: "Speak to a Castle estate advisor. We're here to help you plan your legacy." },
      { property: "og:title", content: "Contact Castle" },
      { property: "og:description", content: "Talk to a Nigerian estate advisor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Contact</p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">
            Let's talk about your <span className="italic text-primary">legacy.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Whether you have a question or need bespoke advice, our team is here to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl shadow-elegant">
              <img src={officeInterior} alt="Castle Lagos office" loading="lazy" className="h-72 w-full object-cover" />
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-8">
              <ContactRow icon={Mail} label="Email" value="hello@castle-ewill.ng" />
              <ContactRow icon={Phone} label="Phone" value="+234 (0)1 700 8888" />
              <ContactRow icon={MapPin} label="Office" value="3rd Floor, Kingsway Tower, Ikoyi, Lagos" />
            </div>
          </div>

          <form className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h2 className="font-serif text-2xl text-navy">Send us a message</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first">First name</Label>
                <Input id="first" placeholder="Adaeze" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last">Last name</Label>
                <Input id="last" placeholder="Okonkwo" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="How can we help?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} placeholder="Tell us a little about what you need…" />
            </div>
            <Button className="w-full bg-navy text-navy-foreground hover:bg-navy/90" size="lg">Send message</Button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-navy text-navy-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 font-serif text-lg text-navy">{value}</p>
      </div>
    </div>
  );
}
