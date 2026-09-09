"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { useFormAction } from "@/hooks/use-api-form";
import { deletePostAction, setPostPublishedAction } from "@/lib/actions/review";
import type { AdminPost, PostStatus } from "@/lib/actions/admin";

/**
 * Publish, take down, delete — from the row, without opening the editor.
 *
 * Taking something down is reversible and is one click. Deleting is not, so it
 * asks first: an article really is removed, and "are you sure" is cheap next
 * to a piece somebody spent an afternoon on.
 */
export function PostRowActions({ post }: { post: AdminPost }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <PublicationToggle post={post} />
      <DeleteButton post={post} />
    </div>
  );
}

/**
 * The one move worth offering on a row.
 *
 * Anything visible can be archived; anything not visible can be published. The
 * *other* transitions — scheduling, returning to draft — need a date or a
 * decision, and belong in the editor where there is room to make one.
 */
function PublicationToggle({ post }: { post: AdminPost }) {
  const [state, action] = useFormAction(setPostPublishedAction);

  const next: PostStatus = post.is_live ? "archived" : "published";

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={post.slug} />
      <input type="hidden" name="status" value={next} />

      <ToggleButton
        label={post.is_live ? "Take down" : "Publish"}
        publish={!post.is_live}
        failed={state.status === "error"}
      />
    </form>
  );
}

function ToggleButton({
  label,
  publish,
  failed,
}: {
  label: string;
  publish: boolean;
  failed: boolean;
}) {
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
      {pending ? "…" : label}
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
