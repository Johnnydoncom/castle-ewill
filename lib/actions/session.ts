"use server";

import { signOut } from "@/auth";
import { auth } from "@/auth";
import { recordAudit } from "@/lib/security/audit";

export async function signOutAction(): Promise<void> {
  const session = await auth();

  if (session?.user?.id) {
    await recordAudit({
      userId: session.user.id,
      action: "auth.logout",
      entityType: "user",
      entityId: session.user.id,
    });
  }

  await signOut({ redirectTo: "/" });
}
