"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/**
 * Repeatable row builder for executors, beneficiaries, guardians, bequests and
 * witnesses.
 *
 * Rows are keyed by a stable client id so that removing the first row does not
 * cause React to re-key — and therefore reset — the inputs below it. Field
 * names are indexed by *position* (`executors.0.fullName`) because that is what
 * the server action reassembles.
 */

export type RowRenderer = (args: {
  index: number;
  name: (field: string) => string;
}) => React.ReactNode;

let counter = 0;
const nextKey = () => `row-${counter++}`;

export function RepeatableList({
  legend,
  addLabel,
  emptyLabel,
  min = 0,
  max = 24,
  initialCount,
  renderRow,
}: {
  legend: string;
  addLabel: string;
  emptyLabel?: string;
  min?: number;
  max?: number;
  initialCount: number;
  renderRow: RowRenderer;
}) {
  const [keys, setKeys] = useState<string[]>(() =>
    Array.from({ length: Math.max(initialCount, min) }, nextKey),
  );

  const add = () => setKeys((k) => (k.length >= max ? k : [...k, nextKey()]));
  const remove = (key: string) =>
    setKeys((k) => (k.length <= min ? k : k.filter((item) => item !== key)));

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">{legend}</legend>

      {keys.length === 0 && emptyLabel && (
        <p className="border border-dashed border-border px-5 py-8 text-center text-sm italic text-muted-foreground">
          {emptyLabel}
        </p>
      )}

      {keys.map((key, index) => (
        <div
          key={key}
          className="relative border border-border bg-background p-5 pt-6 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {legend} {index + 1}
            </span>
            {keys.length > min && (
              <button
                type="button"
                onClick={() => remove(key)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          {renderRow({
            index,
            name: (field) => `${legendToPrefix(legend)}.${index}.${field}`,
          })}
        </div>
      ))}

      {keys.length < max && (
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-navy transition-colors hover:border-gold hover:text-gold"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      )}
    </fieldset>
  );
}

/** `Executor` → `executors`, matching the server action's field prefix. */
function legendToPrefix(legend: string): string {
  const map: Record<string, string> = {
    Executor: "executors",
    Beneficiary: "beneficiaries",
    Guardian: "guardians",
    Bequest: "bequests",
    Witness: "witnesses",
  };
  return map[legend] ?? legend.toLowerCase();
}
