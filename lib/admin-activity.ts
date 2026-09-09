/**
 * Audit actions, in English.
 *
 * The activity table showed the raw key — `content.post_created`,
 * `verification.smile_id.passed` — beside an entity type and the first eight
 * characters of a UUID. That is a log, not a feed: it reads as machine output,
 * and the one thing a person scanning for something unusual needs is to
 * recognise the ordinary at a glance.
 *
 * Unmapped actions fall back to a tidied version of the key rather than being
 * hidden, because an action nobody has named yet is exactly the one worth
 * noticing.
 */
const ACTIONS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "auth.logout": "Signed out",
  "auth.password_reset": "Reset a password",
  "auth.registered": "Registered",

  "will.submitted": "Confirmed a Will",
  "will.approved": "Approved a Will",
  "will.changes_requested": "Requested changes",
  "will.executed": "Marked a Will executed",
  "will.printed": "Printed a Will",
  "will.deleted": "Deleted a Will",

  "verification.submitted": "Submitted an identity check",
  "verification.approved": "Approved an identity",
  "verification.rejected": "Rejected an identity",
  "verification.enrolled": "Enrolled a face",
  "verification.enrolment_failed": "Enrolment failed",
  "verification.smile_id.passed": "Identity confirmed",
  "verification.smile_id.failed": "Identity refused",

  "witness_identity.submitted": "Sent a witness for checking",
  "witness_identity.verified": "Witness confirmed",
  "witness_identity.rejected": "Witness refused",

  "payment.settled": "Payment settled",
  "payment.transfer_confirmed": "Confirmed a bank transfer",
  "pricing.plan_created": "Created a plan",
  "pricing.plan_updated": "Changed a price",

  "content.post_created": "Wrote an article",
  "content.post_updated": "Edited an article",
  "content.post_published": "Published an article",
  "content.post_withdrawn": "Withdrew an article",
  "content.post_deleted": "Deleted an article",

  "admin.created": "Created an administrator",
  "admin.permissions_updated": "Changed permissions",
  "admin.status_changed": "Changed an admin's status",
  "client.status_changed": "Changed a client's status",
  "settings.updated": "Changed a setting",
};

export function activityLabel(action: string): string {
  const known = ACTIONS[action];

  if (known) return known;

  /*
   * `will.changes_requested` → "Will changes requested". Not elegant, but it
   * is readable, and it makes an unmapped action look like the oversight it is
   * rather than like a deliberate code.
   */
  const words = action.replace(/[._]/g, " ").trim();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Which of the three an entry is, so the feed can be scanned by colour.
 *
 * Only two things are ever called out: something that failed, and something
 * that changed money or permissions. Everything else is ordinary, and marking
 * it would defeat the point.
 */
export function activityTone(action: string): "danger" | "warn" | "neutral" {
  if (/(failed|rejected|refused|deleted|withdrawn)/.test(action)) return "danger";
  if (/(pricing|payment|permissions|settings|admin\.)/.test(action)) return "warn";

  return "neutral";
}
