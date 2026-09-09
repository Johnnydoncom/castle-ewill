"use client";

import { useState } from "react";
import { X } from "lucide-react";

/**
 * Tags, typed rather than chosen.
 *
 * Asking a writer to go and define "probate" somewhere before they can use it
 * is how nobody tags anything — the backend makes a tag on first use, matching
 * on the slug so "Probate" and "probate" never become two.
 *
 * Each tag is submitted as its own `tags[]` field, which is how `FormData`
 * carries a list. A comma-joined string would have to be split somewhere, and
 * that somewhere would eventually disagree with the server about what a comma
 * inside a tag means.
 */
export function TagField({ defaultTags }: { defaultTags: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const name = raw.trim().replace(/,$/, "").trim();

    if (name === "") return;

    // Compared case-insensitively here too, so the field does not show two
    // chips the server is about to merge into one tag.
    const already = tags.some((tag) => tag.toLowerCase() === name.toLowerCase());

    if (!already && tags.length < 12) setTags([...tags, name]);

    setDraft("");
  };

  return (
    <div>
      <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Tags
      </span>

      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1.5 border border-border bg-muted/40 py-1 pl-2.5 pr-1 text-xs text-navy"
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <input
        value={draft}
        onChange={(event) => {
          // A trailing comma is how people finish a tag without thinking.
          if (event.target.value.endsWith(",")) {
            add(event.target.value);

            return;
          }

          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            /*
             * Enter must not submit the article. Inside a form, an unhandled
             * Enter in a text input saves it — which here would publish a
             * half-written piece because somebody finished typing a tag.
             */
            event.preventDefault();
            add(draft);

            return;
          }

          if (event.key === "Backspace" && draft === "" && tags.length > 0) {
            setTags(tags.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={tags.length >= 12 ? "Twelve is plenty" : "Type a tag, press Enter"}
        disabled={tags.length >= 12}
        className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none disabled:bg-muted/30"
      />
    </div>
  );
}
