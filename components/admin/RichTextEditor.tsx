"use client";

import { useCallback, useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

/**
 * The article editor.
 *
 * A `<textarea>` was the whole of it before — an article could be typed but
 * not shaped, and the public page rendered it by splitting on blank lines,
 * so a heading, a list or a link was simply not expressible.
 *
 * ## What it is allowed to produce
 *
 * The toolbar is deliberately short, and it matches `ArticleHtml` on the
 * backend exactly: paragraphs, two levels of heading, bold, italic, strike,
 * lists, quotes, code, a rule, links and images. Anything the editor cannot
 * produce is anything the sanitiser would strip anyway, so a writer never
 * formats something that silently disappears on save.
 *
 * There is no colour, no font and no alignment. An article that can set its
 * own type is an article that will eventually not look like the site.
 *
 * ## Why the value is a hidden input
 *
 * The surrounding form is a plain `<form action={…}>` — a server action
 * reading `FormData`. TipTap keeps its document in its own state, so the HTML
 * is mirrored into a hidden field on every change and the form needs to know
 * nothing about the editor.
 */
export function RichTextEditor({
  name,
  defaultValue,
  ariaLabel,
}: {
  name: string;
  defaultValue: string;
  ariaLabel: string;
}) {
  const editor = useEditor({
    /*
     * Server-rendering a contenteditable produces a hydration mismatch — the
     * server has no document. Rendering only in the browser is TipTap's own
     * guidance for React 18+.
     */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // The sanitiser keeps h2–h4; h1 belongs to the page, not to a section
        // inside it, and two h1s on one page is a real SEO fault.
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Matches the backend's allow-list. A scheme it strips is a scheme the
        // editor should never have offered.
        protocols: ["http", "https", "mailto", "tel"],
      }),
      Image.configure({ inline: false }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        class:
          "prose-article min-h-[26rem] w-full px-4 py-4 text-[15px] leading-relaxed text-navy focus:outline-none",
      },
    },
  });

  /*
   * The document, mirrored into the form.
   *
   * Held in React state rather than read on submit: a server action receives
   * `FormData` built from the DOM, and the editor's document lives outside it.
   */
  const html = editor?.getHTML() ?? defaultValue;

  return (
    <div className="border border-border bg-background focus-within:border-gold">
      <input type="hidden" name={name} value={editor ? html : defaultValue} />

      {editor && <Toolbar editor={editor} />}

      <EditorContent editor={editor} />

      {!editor && (
        // The editor mounts in the browser only, so the server render needs
        // something the right shape rather than a collapsed box.
        <div className="min-h-[26rem] px-4 py-4 text-sm text-muted-foreground">
          Loading the editor…
        </div>
      )}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  /*
   * Re-render on every selection and document change.
   *
   * Without this the buttons never light up: TipTap mutates its own state and
   * React has no reason to know the cursor has moved into a heading.
   */
  useEffect(() => {
    const rerender = () => editor.view.updateState(editor.view.state);

    editor.on("selectionUpdate", rerender);

    return () => {
      editor.off("selectionUpdate", rerender);
    };
  }, [editor]);

  const setLink = useCallback(() => {
    const existing = editor.getAttributes("link").href as string | undefined;

    const href = window.prompt("Link address", existing ?? "https://");

    // Cancel leaves it alone; clearing the box removes the link. Those are
    // different intentions and were worth telling apart.
    if (href === null) return;

    if (href.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const src = window.prompt("Image address", "https://");

    if (src === null || src.trim() === "") return;

    /*
     * A URL, not an upload. The vault is for a client's identity documents and
     * their executed Will; putting marketing imagery through it would mean
     * encrypting, authorising and auditing a picture meant to be seen by
     * everybody.
     */
    editor.chain().focus().setImage({ src: src.trim() }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="Section heading"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="Sub-heading"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bulleted list"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="Code"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Divider"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Divider />

      <Button onClick={setLink} active={editor.isActive("link")} label="Link">
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        label="Remove link"
      >
        <Link2Off className="h-4 w-4" />
      </Button>
      <Button onClick={addImage} label="Image">
        <ImagePlus className="h-4 w-4" />
      </Button>

      <Divider />

      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

function Button({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      // Never `submit`: inside a `<form>` the default type would save the
      // article every time somebody pressed Bold.
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center transition-colors disabled:opacity-30 ${
        active
          ? "bg-navy text-navy-foreground"
          : "text-muted-foreground hover:bg-background hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}
