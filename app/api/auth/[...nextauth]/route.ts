import { handlers } from "@/auth";

/**
 * Auth.js session endpoints (`/api/auth/*`).
 * The previous hand-rolled stub at `app/api/auth/route.ts` was removed — it
 * would have shadowed this catch-all segment.
 */
export const { GET, POST } = handlers;
