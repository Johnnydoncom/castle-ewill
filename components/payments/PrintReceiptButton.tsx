"use client";

import { Printer } from "lucide-react";

/** Prints the receipt — or saves it as a PDF, from the same browser dialog. */
export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 border border-border bg-background px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
    >
      <Printer className="h-4 w-4" />
      Print or save
    </button>
  );
}
