/**
 * Single source of truth for company identity.
 * Values are taken from the client brief; update here and every page, email
 * footer and generated document follows.
 */
export const COMPANY = {
  name: "Castle eWill & Trust",
  legalName: "Castle eWill and Trust Limited",
  shortName: "Castle",
  rcNumber: "9701348",
  address:
    "No. 29b, Olorunnimbe Street, Wemabod Estate, off Adeniyi Jones, Ikeja, Lagos State, Nigeria.",
  addressLines: [
    "No. 29b, Olorunnimbe Street",
    "Wemabod Estate, off Adeniyi Jones",
    "Ikeja, Lagos State, Nigeria",
  ],
  email: "ewillcastle@gmail.com",
  phone: "08111115547",
  phoneHref: "tel:+2348111115547",
  business: "Online drafting of Wills and Trusts",
} as const;

export const FOUNDING_BELIEF =
  "That every person deserves the opportunity to preserve a lifetime of work, protect loved ones and leave this world with the confidence that their lawful wishes will be honoured.";

export const BANNERS = [
  "Legacies fade when left unguarded. Keep yours alive with Castle eWill.",
  "You have worked hard to build your legacy. Now take the right steps to protect it.",
] as const;

export const VISION =
  "To become Africa's most trusted digital platform for estate planning, Will preparation, Trust administration, and probate support.";

export const MISSION =
  "To simplify estate planning by enabling every adult to prepare, update, securely store, and manage legally compliant Wills and Trusts anytime, anywhere.";

export const CORE_VALUES = [
  {
    name: "Integrity",
    body: "We do what is right, especially when no one is watching.",
  },
  {
    name: "Professional Excellence",
    body: "Every document is prepared to the standard we would want for our own family.",
  },
  {
    name: "Confidentiality",
    body: "What you tell us stays between us. Always.",
  },
  {
    name: "Accountability",
    body: "We own our work and our mistakes, and we correct them.",
  },
  {
    name: "Transparency",
    body: "Clear pricing, clear process, no hidden terms.",
  },
  {
    name: "Respect",
    body: "Every client is treated with dignity, whatever the size of the estate.",
  },
  {
    name: "Innovation",
    body: "We use technology to widen access, never to cut corners.",
  },
  {
    name: "Service",
    body: "We measure ourselves by the peace of mind our clients carry.",
  },
] as const;

/** From the client's ethics charter — rendered verbatim on the About page. */
export const ETHICAL_COMMITMENTS = [
  "compromise client confidentiality",
  "mislead clients",
  "exploit vulnerable persons",
  "manipulate legal processes",
  "disregard regulatory obligations",
  "misuse personal information",
  "prioritise profit over integrity",
] as const;

export const CLIENT_COMMITMENTS = [
  "respect every client's lawful wishes",
  "protect confidential information",
  "communicate honestly and clearly",
  "deliver services with competence and diligence",
  "improve continuously",
  "maintain professional independence",
  "earn trust through consistent conduct",
] as const;

export const PRIVACY_PRINCIPLES = [
  "Privacy by Design and Default is applied throughout the organisation.",
  "Personal information is collected only where lawful and necessary.",
  "Appropriate technical and organisational measures are in place to protect all personal information.",
  "Everyone at Castle eWill and Trust shares responsibility for protecting client information.",
] as const;

/** Events after which the client brief asks us to prompt a Will review. */
export const REVIEW_TRIGGERS = [
  { label: "Every 12 months", detail: "A routine check that nothing has drifted." },
  { label: "Marriage", detail: "Marriage can revoke a Will made before it." },
  { label: "Birth of a child", detail: "New dependants need guardians and provision." },
  { label: "Acquisition of property", detail: "New assets should be accounted for." },
] as const;
