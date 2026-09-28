import { apiData } from "@/lib/api/client";
import type { WillAccessOverview } from "@/lib/will/access";

/**
 * Who may read this Will, and who has — for its owner's page.
 *
 * A server read through the session-forwarding door; the mutations are in
 * `will-access.client.ts`. An unreachable API renders an empty panel rather
 * than taking the Will's page down with it.
 */
export async function getWillAccess(willId: string): Promise<WillAccessOverview> {
  return apiData<WillAccessOverview>(`/wills/${willId}/access`, {
    grants: [],
    history: [],
  });
}
