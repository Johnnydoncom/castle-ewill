"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, Eye, Save } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { savePostAction } from "@/lib/actions/review";
import type { AdminPostDetail } from "@/lib/actions/admin";

/**
 * Writing an article.
 *
 * One form for both new and existing pieces — the difference is a hidden
 * `editingSlug`, and whether the web address is shown as editable or as the
 * URL it already is.
 *
 * **The slug is deliberately awkward to change.** It is the article's public
 * address, and moving it breaks every link anybody has shared. On a new piece
 * it is left blank and derived from the title server-side; on an existing one
 * it is revealed only behind a deliberate click, with a note saying what it
 * costs. The backend keeps the existing slug when the field is not sent.
 */
export function PostEditor({ post }: { post?: AdminPostDetail }) {
  const [state, action] = useFormAction(savePostAction);
  const [showSlug, setShowSlug] = useState(false);

  const editing = post !== undefined;

  /** Echoed back on a failed save, so a rejected form is not a lost draft. */
  const value = (name: string, fallback: string) =>
    typeof state.values?.[name] === "string"
      ? (state.values[name] as string)
      : fallback;

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="editingSlug" value={post?.slug ?? ""} />

      {state.status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-6">
          <Field
            label="Headline"
            name="title"
            defaultValue={value("title", post?.title ?? "")}
            error={fieldError("title")}
            placeholder="Making a Will in Nigeria"
            required
          />

          <Field
            label="Summary"
            name="excerpt"
            defaultValue={value("excerpt", post?.excerpt ?? "")}
            error={fieldError("excerpt")}
            hint="Shown on the blog index and in search results. Two sentences at most."
            textarea
            rows={3}
            maxLength={512}
            required
          />

          <Field
            label="Article"
            name="body"
            defaultValue={value("body", post?.body ?? "")}
            error={fieldError("body")}
            hint="Plain paragraphs, separated by a blank line."
            textarea
            rows={22}
            required
            mono
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="space-y-6 border border-border bg-background p-5">
            <Field
              label="Category"
              name="category"
              defaultValue={value("category", post?.category ?? "")}
              error={fieldError("category")}
              placeholder="Wills"
              required
            />

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={post?.is_published ?? false}
                className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
              />
              <span className="text-sm leading-relaxed text-navy">
                Published
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Unticked, it is saved as a draft and is visible only here.
                </span>
              </span>
            </label>

            {/*
              Reading time is not offered. It is estimated from the article
              server-side at 200 words a minute — an estimate nobody has to
              maintain beats an accurate number nobody remembers to update.
            */}
          </div>

          {editing && (
            <div className="border border-border bg-background p-5">
              <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Web address
              </p>

              <p className="mt-2 break-all font-mono text-xs text-navy">
                /blog/{post.slug}
              </p>

              {showSlug ? (
                <>
                  <input
                    name="slug"
                    defaultValue={value("slug", post.slug)}
                    className="mt-3 w-full border border-border bg-background px-3 py-2 font-mono text-xs text-navy focus:border-gold focus:outline-none"
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-destructive">
                    Changing this breaks every link to this article that anyone
                    has already shared.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSlug(true)}
                  className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-navy"
                >
                  Change the address
                </button>
              )}

              {fieldError("slug") && (
                <p className="mt-2 text-xs text-destructive">{fieldError("slug")}</p>
              )}
            </div>
          )}

          {editing && post.is_published && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-navy hover:text-navy"
            >
              <Eye className="h-3.5 w-3.5" />
              View on the site
            </Link>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <SaveButton editing={editing} />

        <Link
          href="/admin/posts"
          className="text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-navy"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 items-center gap-2.5 bg-navy px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {pending ? "Saving…" : editing ? "Save changes" : "Create article"}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  hint,
  placeholder,
  textarea,
  rows,
  maxLength,
  required,
  mono,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  mono?: boolean;
}) {
  const className = `mt-2 w-full border bg-background px-3.5 py-2.5 text-sm text-navy focus:border-gold focus:outline-none ${
    error ? "border-destructive" : "border-border"
  } ${mono ? "font-mono text-[13px] leading-relaxed" : ""}`;

  return (
    <label className="block">
      <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>

      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={rows}
          maxLength={maxLength}
          required={required}
          placeholder={placeholder}
          className={className}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          maxLength={maxLength}
          required={required}
          placeholder={placeholder}
          className={className}
        />
      )}

      {hint && !error && (
        <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      )}

      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
