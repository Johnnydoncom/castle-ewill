/** Reference data used by the wizard's select inputs. */

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

export const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: "Real estate",
  bank_account: "Bank account",
  shares: "Shares & securities",
  business: "Business interest",
  vehicle: "Vehicle",
  digital: "Digital asset",
  insurance: "Insurance policy",
  other: "Other",
};

export const WILL_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  executed: "Executed",
  archived: "Archived",
};
