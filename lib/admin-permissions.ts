/**
 * The console's delegable permission catalog — mirrors
 * `App\Support\AdminPermission` on the backend exactly. Kept as a literal
 * list here (not derived from an API call) because the nav needs it
 * synchronously on every render, and the set changes about as often as the
 * nav sections themselves do.
 *
 * `manage_admins` deliberately has no entry — see the backend catalog's
 * docblock for why that power is a superadmin flag, never a grantable
 * permission.
 */
export const ADMIN_PERMISSIONS = [
  { value: "manage_clients", label: "Clients", description: "View and suspend/reactivate client accounts." },
  { value: "manage_wills", label: "Wills", description: "Review, approve, request changes on submitted Wills." },
  { value: "manage_verifications", label: "Identity", description: "Approve or reject identity/KYC verification attempts." },
  { value: "manage_payments", label: "Payments", description: "View payments, confirm bank transfers, edit the bank account." },
  { value: "manage_messages", label: "Messages", description: "View and resolve contact-form submissions." },
  { value: "manage_settings", label: "Settings", description: "View dependency health and edit the bank account." },
] as const;

export type AdminPermissionValue = (typeof ADMIN_PERMISSIONS)[number]["value"];

export const ADMIN_PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  ADMIN_PERMISSIONS.map((p) => [p.value, p.label]),
);
