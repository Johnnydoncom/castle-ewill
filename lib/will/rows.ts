/**
 * The wizard's repeatable rows, reassembled into what the API takes.
 *
 * The forms post rows as `executors.0.firstName`, and a guardian inside a
 * beneficiary's row as `beneficiaries.0.guardian.firstName`. The API takes a
 * JSON array of snake_case objects, with the guardian nested. Pure, so it can
 * be tested without a browser.
 */

/**
 * Reassembles `prefix.N.field` form fields into an ordered array of rows.
 *
 * Indices are read from the field names rather than assumed contiguous: the
 * wizard lets a middle row be removed without renumbering the ones below, so
 * `0, 2, 3` is a normal submission and collapsing it blindly would drop a row.
 * Dots after the index nest, so `guardian.firstName` becomes
 * `{ guardian: { first_name } }`.
 */
export function collectRows(
  formData: FormData,
  prefix: string,
): Array<Record<string, unknown>> {
  const rows = new Map<number, Record<string, unknown>>();
  const pattern = new RegExp(`^${prefix}\\.(\\d+)\\.(.+)$`);

  for (const [key, value] of formData.entries()) {
    const match = key.match(pattern);
    if (!match || typeof value !== "string") continue;

    const index = Number(match[1]);
    const row = rows.get(index) ?? {};

    setPath(row, match[2].split(".").map(toSnakeCase), value);
    rows.set(index, row);
  }

  return [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row);
}

function setPath(target: Record<string, unknown>, path: string[], value: string): void {
  let node = target;

  for (const part of path.slice(0, -1)) {
    const next = node[part];
    node[part] = next !== null && typeof next === "object" ? next : {};
    node = node[part] as Record<string, unknown>;
  }

  const leaf = path[path.length - 1];

  // Checkboxes post "on"; the API expects a real boolean.
  node[leaf] = leaf.startsWith("is_") ? value === "on" || value === "true" : value;
}

export function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Translates the API's snake_case field errors back onto the wizard's field
 * names, so an error on `beneficiaries.0.guardian.first_name` highlights the
 * input named `beneficiaries.0.guardian.firstName`.
 */
export function mapFieldErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;

  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [
      key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      messages,
    ]),
  );
}
