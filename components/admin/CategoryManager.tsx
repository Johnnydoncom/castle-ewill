"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Pencil, Plus, Trash2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import {
  deletePostCategoryAction,
  savePostCategoryAction,
} from "@/lib/actions/review";
import type { PostCategory } from "@/lib/actions/admin";

/**
 * Blog categories, managed.
 *
 * These were a free-text string typed onto each article, so nothing could list
 * what existed or notice that "Executors" and "executors" had become two.
 *
 * The list is rendered from the server's copy and every action reloads the
 * route — no optimistic state. A category is edited rarely and read often, and
 * a local copy that disagrees with the server about what exists is worse than
 * a page that takes a moment.
 */
export function CategoryManager({ categories }: { categories: PostCategory[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="divide-y divide-border border border-border bg-background">
        {categories.length === 0 && !adding && (
          <p className="px-5 py-10 text-center text-sm italic text-muted-foreground">
            No categories yet. Articles can be written without one.
          </p>
        )}

        {categories.map((category) =>
          editing === category.id ? (
            <CategoryForm
              key={category.id}
              category={category}
              onDone={() => setEditing(null)}
            />
          ) : (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-navy">{category.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  /blog?category={category.slug}
                </p>
                {category.description && (
                  <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {category.posts_count} article
                  {category.posts_count === 1 ? "" : "s"}
                </span>

                <button
                  type="button"
                  onClick={() => setEditing(category.id)}
                  aria-label={`Edit ${category.name}`}
                  className="p-1.5 text-muted-foreground transition-colors hover:text-navy"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <DeleteCategory category={category} />
              </div>
            </div>
          ),
        )}

        {adding && <CategoryForm onDone={() => setAdding(false)} />}
      </div>

      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-11 items-center gap-2 border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          <Plus className="h-4 w-4" />
          New category
        </button>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: PostCategory;
  onDone: () => void;
}) {
  const [state, action] = useFormAction(savePostCategoryAction, { onSuccess: onDone });
  const [showSlug, setShowSlug] = useState(false);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} className="space-y-4 bg-muted/20 px-5 py-5">
      <input type="hidden" name="editingSlug" value={category?.slug ?? ""} />

      {state.status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <label className="block">
          <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Name
          </span>
          <input
            name="name"
            defaultValue={category?.name ?? ""}
            required
            autoFocus
            className="mt-1.5 w-full border border-border bg-background px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
          />
          {fieldError("name") && (
            <span className="mt-1 block text-xs text-destructive">
              {fieldError("name")}
            </span>
          )}
        </label>

        <label className="block">
          <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Order
          </span>
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={category?.sort_order ?? 0}
            className="mt-1.5 w-full border border-border bg-background px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Description
        </span>
        <input
          name="description"
          defaultValue={category?.description ?? ""}
          placeholder="Optional. Shown where the category is introduced."
          className="mt-1.5 w-full border border-border bg-background px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none"
        />
      </label>

      {category &&
        (showSlug ? (
          <label className="block">
            <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Web address
            </span>
            <input
              name="slug"
              defaultValue={category.slug}
              className="mt-1.5 w-full border border-border bg-background px-3 py-2 font-mono text-xs text-navy focus:border-gold focus:outline-none"
            />
            {/*
              Same rule as an article's: a category slug is a public URL the
              moment the blog filters on it, so renaming must not move it.
            */}
            <span className="mt-1 block text-[11px] text-destructive">
              Changing this breaks any link that filters by this category.
            </span>
            {fieldError("slug") && (
              <span className="mt-1 block text-xs text-destructive">
                {fieldError("slug")}
              </span>
            )}
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowSlug(true)}
            className="text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-navy"
          >
            Change the web address
          </button>
        ))}

      <div className="flex items-center gap-4 pt-1">
        <SaveButton editing={category !== undefined} />

        <button
          type="button"
          onClick={onDone}
          className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-navy"
        >
          Cancel
        </button>
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
      className="flex h-10 items-center gap-2 bg-navy px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-foreground transition-colors hover:bg-navy/90 disabled:opacity-60"
    >
      <Check className="h-3.5 w-3.5" />
      {pending ? "Saving…" : editing ? "Save" : "Create"}
    </button>
  );
}

function DeleteCategory({ category }: { category: PostCategory }) {
  const [confirming, setConfirming] = useState(false);
  const [, action] = useFormAction(deletePostCategoryAction);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${category.name}`}
        className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="slug" value={category.slug} />

      <button
        type="submit"
        className="border border-destructive px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
      >
        {/*
          Said plainly, because it is the thing somebody would not expect: the
          articles survive. An article is an afternoon's work; a category is a
          label.
        */}
        {category.posts_count > 0
          ? `Delete — ${category.posts_count} article${category.posts_count === 1 ? "" : "s"} kept`
          : "Delete"}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-navy"
      >
        Keep
      </button>
    </form>
  );
}
