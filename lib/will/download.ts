import type { PrintBlocker } from "@/lib/actions/will";

/**
 * Why a Will cannot be downloaded from the vault yet, and where to go about it.
 *
 * The reason is the server's (`journey.print_blocked_by`); the vault only words
 * it. The gates are the Will page's own — paid for, identity confirmed, an
 * active subscription — so the vault is never a way round them.
 */
export type WillDownloadBlock = {
  message: string;
  cta: { label: string; href: string };
};

export function willDownloadBlock(
  willId: string,
  blocker: PrintBlocker | null | undefined,
): WillDownloadBlock | null {
  const willPage = `/dashboard/wills/${willId}`;

  switch (blocker) {
    case null:
    case undefined:
      return null;
    case "subscription_required":
      return {
        message:
          "This Will's subscription has ended, so downloading it is paused. Renew to download it again — nothing has been deleted.",
        cta: { label: "Renew subscription", href: `${willPage}#subscription` },
      };
    case "kyc_required":
      return {
        message: "Confirm your identity to download your Will.",
        cta: { label: "Verify my identity", href: "/dashboard/kyc" },
      };
    case "unpaid":
      return {
        message: "Pay for this Will to download it.",
        cta: { label: "Go to payment", href: willPage },
      };
    case "incomplete":
      return {
        message: "Finish your Will to download it.",
        cta: { label: "Continue your Will", href: willPage },
      };
    case "passport_photograph_required":
      return {
        message: "Add your passport photograph — it is printed on your Will.",
        cta: { label: "Open this Will", href: willPage },
      };
    case "witnesses_required":
      return {
        message: "Your witnesses need confirming before your Will can be downloaded.",
        cta: { label: "Open this Will", href: willPage },
      };
  }
}

/** Where to renew the subscription that covers a vault document. */
export function renewHrefFor(willId: string | null | undefined): string {
  return willId ? `/dashboard/wills/${willId}#subscription` : "/dashboard/payments";
}
