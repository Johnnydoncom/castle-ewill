import Link from "next/link";

import type { SettingGroup } from "@/lib/actions/admin";

/**
 * Moves between settings modules without going back to the index.
 *
 * Rendered from the groups the server publishes rather than a hand-written
 * list, so a module added to `SettingsCatalog` appears here automatically. A
 * nav that had to be edited separately is a nav that eventually omits
 * something and leaves a page reachable only by typing its URL.
 */
export function SettingsNav({
  groups,
  current,
}: {
  groups: SettingGroup[];
  current: string;
}) {
  return (
    <nav aria-label="Settings sections" className="border-b border-border">
      <ul className="-mb-px flex flex-wrap gap-x-6 gap-y-1">
        {groups.map((group) => {
          const isCurrent = group.key === current;

          return (
            <li key={group.key}>
              <Link
                href={`/admin/settings/${group.key}`}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-block border-b-2 px-1 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  isCurrent
                    ? "border-gold text-navy"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-navy"
                }`}
              >
                {group.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
