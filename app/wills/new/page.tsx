import { redirect } from "next/navigation";

/**
 * The Will builder now lives inside the authenticated dashboard so that every
 * step is persisted against the signed-in user. This route is kept as a
 * redirect because it was linked publicly.
 */
export default function NewWillPage() {
  redirect("/dashboard/will");
}
