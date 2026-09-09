"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { deletePostAction, setPostPublishedAction } from "@/lib/actions/review";
import type { AdminPost } from "@/lib/actions/admin";

/**
 * Publish, withdraw, delete — from the row, without opening the editor.
 *
 * Withdrawing is the reversible act and is one click. Deleting is not, so it
 * asks first: an article is referenced by nothing and really is removed, and
 * "are you sure" is cheap next to a piece somebody spent an afternoon on.
 */
export function PostRowActions({ post }: { post: AdminPost }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <PublicationToggle post={post} />
      <DeleteButton post={post} />
    </div>
  );
}

function PublicationToggle({ post }: { post: AdminPost }) {
  const [state, action] = useFormAction(setPostPublishedAction);

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={post.slug} />
      {/*
        The checkbox convention the rest of the console uses: present means on.
        Rendered only when publishing, so withdrawing sends nothing at all.
      */}
      {!post.is_published && (
        <input type="hidden" name="isPublished" value="on" />
      )}

      <ToggleButton
        publish={!post.is_published}
        failed={state.status === "error"}
      />
    </form>
  );
}

function ToggleButton({ publish, failed }: { publish: boolean; failed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={failed ? "That did not save — try again" : undefined}
      className={`border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-colors disabled:opacity-50 ${
        failed
          ? "border-destructive text-destructive"
          : publish
            ? "border-success/50 text-success hover:bg-success/10"
            : "border-border text-muted-foreground hover:border-navy hover:text-navy"
      }`}
    >
      {pending ? "…" : publish ? "Publish" : "Withdraw"}
    </button>
  );
}

function DeleteButton({ post }: { post: AdminPost }) {
  const [confirming, setConfirming] = useState(false);
  const [, action] = useFormAction(deletePostAction);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${post.title}`}
        className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="slug" value={post.slug} />

      <button
        type="submit"
        className="border border-destructive px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
      >
        Delete
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
