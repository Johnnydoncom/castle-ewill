"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/**
 * Repeatable row builder for executors, beneficiaries, trustees, assets,
 * bequests and witnesses.
 *
 * Rows are keyed by a stable client id so that removing the first row does not
 * cause React to re-key — and therefore reset — the inputs below it. Field
 * names are indexed by *position* (`executors.0.firstName`) because that is
 * what the action reassembles.
 */

export type RowRenderer = (args: {
  index: number;
  name: (field: string) => string;
  /**
   * Which of the saved rows this one shows — its position when the page
   * loaded — or null for a row added since.
   *
   * Not `index`. Looking saved data up by position meant removing the first
   * of two rows left the second showing the *first* row's details, because it
   * had moved into position 0. With beneficiary ids posted alongside, that
   * would have kept the person the client removed and deleted the one they
   * kept.
   */
  source: number | null;
}) => React.ReactNode;

let counter = 0;
const nextKey = () => `row-${counter++}`;

export function RepeatableList({
  legend,
  prefix,
  addLabel,
  emptyLabel,
  min = 0,
  max = 24,
  initialCount,
  renderRow,
}: {
  legend: string;
  /**
   * The field-name prefix these rows post under — `executors`, `assets`.
   *
   * Required, and deliberately not derived from `legend`. It used to be
   * inferred from the display text through a fixed map, so a legend nobody had
   * added to that map fell back to a singular guess: an "Asset" row posted
   * `asset.0.description` while the action collected `assets.…`, and the whole
   * step saved nothing at all.
   */
  prefix: string;
  addLabel: string;
  emptyLabel?: string;
  min?: number;
  max?: number;
  initialCount: number;
  renderRow: RowRenderer;
}) {
  const [rows, setRows] = useState<Array<{ key: string; source: number | null }>>(() =>
    Array.from({ length: Math.max(initialCount, min) }, (_, index) => ({
      key: nextKey(),
      source: index,
    })),
  );

  const add = () =>
    setRows((r) => (r.length >= max ? r : [...r, { key: nextKey(), source: null }]));
  const remove = (key: string) =>
    setRows((r) => (r.length <= min ? r : r.filter((row) => row.key !== key)));

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">{legend}</legend>

      {rows.length === 0 && emptyLabel && (
        <p className="border border-dashed border-border px-5 py-8 text-center text-sm italic text-muted-foreground">
          {emptyLabel}
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.key}
          className="relative border border-border bg-background p-5 pt-6 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
              {legend} {index + 1}
            </span>
            {rows.length > min && (
              <button
                type="button"
                onClick={() => remove(row.key)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          {renderRow({
            index,
            name: (field) => `${prefix}.${index}.${field}`,
            source: row.source,
          })}
        </div>
      ))}

      {rows.length < max && (
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
