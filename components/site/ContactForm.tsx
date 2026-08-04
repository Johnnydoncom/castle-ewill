"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type FieldErrors = Record<string, string[] | undefined>;

/**
 * Posts straight to the Laravel API rather than through a Next route.
 *
 * Direct on purpose: the contact endpoint is rate limited **per IP**, and a
 * relay through this server would present every visitor as the same address —
 * either throttling honest senders collectively or, if the limit were raised to
 * compensate, removing the control entirely.
 *
 * The endpoint is anonymous, so no credential travels with the request. CORS on
 * the backend allows exactly this origin and no other.
 *
 * Client validation here is purely for fast feedback. The backend validates
 * again, checks the honeypot and enforces the throttle.
 */
export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    setPending(true);
    setErrors({});
    setBanner(null);

    try {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

      const response = await fetch(`${base}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        errors?: FieldErrors;
      };

      if (!response.ok) {
        setErrors(result.errors ?? {});
        setBanner({
          tone: "error",
          text:
            response.status === 429
              ? "You have sent several messages already. Please wait a little before sending another."
              : result.message ??
                "We could not send your message. Please try again.",
        });
        return;
      }

      form.reset();
      setBanner({
        tone: "success",
        text: result.message ?? "Thank you — we have received your message.",
      });
    } catch {
      setBanner({
        tone: "error",
        text: "We could not reach the server. Please check your connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  const field =
    "w-full border-0 border-b border-border bg-transparent px-0 py-2.5 font-serif text-base text-navy transition-colors placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none";
  const labelClass =
    "font-serif text-[10px] uppercase tracking-[0.28em] text-navy";

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {banner && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 border-l-2 px-4 py-3 text-sm ${
            banner.tone === "success"
              ? "border-success bg-success/5 text-navy"
              : "border-destructive bg-destructive/5 text-navy"
          }`}
        >
          {banner.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <p>{banner.text}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input id="contact-name" name="name" required className={field} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className={field}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-phone" className={labelClass}>
            Phone (optional)
          </label>
          <input id="contact-phone" name="phone" className={field} />
        </div>

        <div className="space-y-2">
          <label htmlFor="contact-subject" className={labelClass}>
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            required
            className={field}
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="contact-message" className={labelClass}>
          How can we help?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          className="w-full resize-y border border-border bg-transparent px-3 py-2.5 font-serif text-base text-navy transition-colors focus:border-gold focus:outline-none"
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message[0]}</p>
        )}
      </div>

      {/*
        Honeypot.

        Hidden from people and from screen readers, so a browser always submits
        it empty; naive bots fill every input they find. The backend answers a
        filled honeypot with the same cheerful 202 as a real submission —
        telling a bot it was detected only teaches its author to stop filling
        the field.

        `tabIndex={-1}` and `autoComplete="off"` keep a password manager or a
        keyboard user from wandering into it by accident.
      */}
      <div aria-hidden className="hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-14 w-full items-center justify-center gap-3 bg-navy font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-navy-foreground/30 border-t-navy-foreground"
          />
        )}
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
