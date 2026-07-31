import { COMPANY } from "@/lib/company";

/**
 * Branded transactional email templates.
 *
 * Table-based layout with inline styles — the only reliable approach across
 * Outlook, Gmail and mobile clients. Every template ships a plain-text
 * alternative so the message survives text-only readers and spam filters.
 */

const NAVY = "#1b2340";
const GOLD = "#c8a04a";
const MUTED = "#5b6478";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(options: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  footnote?: string;
}): string {
  const { preheader, heading, body, ctaLabel, ctaHref, footnote } = options;

  const cta =
    ctaLabel && ctaHref
      ? `<tr><td style="padding:8px 0 28px;">
           <a href="${ctaHref}" style="display:inline-block;background:${GOLD};color:${NAVY};text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;padding:15px 32px;">${escapeHtml(ctaLabel)}</a>
         </td></tr>`
      : "";

  const note = footnote
    ? `<tr><td style="padding-top:8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:20px;color:${MUTED};">${footnote}</td></tr>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e6ec;">
      <tr><td style="background:${NAVY};padding:28px 32px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#ffffff;letter-spacing:0.5px;">Castle</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${GOLD};letter-spacing:3px;text-transform:uppercase;margin-top:4px;">eWill &amp; Trust</div>
      </td></tr>
      <tr><td style="padding:36px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:34px;color:${NAVY};padding-bottom:18px;">${escapeHtml(heading)}</td></tr>
          <tr><td style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:25px;color:${MUTED};padding-bottom:26px;">${body}</td></tr>
          ${cta}
          ${note}
        </table>
      </td></tr>
      <tr><td style="padding:28px 32px 32px;border-top:1px solid #e4e6ec;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:19px;color:#8b93a5;">
        ${escapeHtml(COMPANY.legalName)} &middot; RC ${escapeHtml(COMPANY.rcNumber)}<br>
        ${escapeHtml(COMPANY.address)}<br>
        ${escapeHtml(COMPANY.email)} &middot; ${escapeHtml(COMPANY.phone)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export function verifyEmailTemplate(name: string, url: string) {
  return {
    subject: "Confirm your email address",
    html: layout({
      preheader: "One click confirms your Castle eWill & Trust account.",
      heading: `Welcome, ${escapeHtml(name)}.`,
      body: "Your account has been created. Confirm your email address to unlock the Will builder and your encrypted document vault.",
      ctaLabel: "Confirm email address",
      ctaHref: url,
      footnote: `This link expires in 24 hours. If the button does not work, paste this address into your browser:<br><span style="word-break:break-all;color:${MUTED};">${escapeHtml(url)}</span>`,
    }),
    text: [
      `Welcome, ${name}.`,
      "",
      "Confirm your email address to activate your Castle eWill & Trust account:",
      url,
      "",
      "This link expires in 24 hours.",
      "",
      `${COMPANY.legalName} · RC ${COMPANY.rcNumber}`,
    ].join("\n"),
  };
}

export function passwordResetTemplate(name: string, url: string) {
  return {
    subject: "Reset your password",
    html: layout({
      preheader: "A password reset was requested for your account.",
      heading: `Reset your password, ${escapeHtml(name)}.`,
      body: "We received a request to reset the password on your Castle eWill &amp; Trust account. If this was you, choose a new password using the button below.",
      ctaLabel: "Choose a new password",
      ctaHref: url,
      footnote: `This link expires in one hour and can be used once. If you did not request a reset, no action is needed — your password remains unchanged.<br><span style="word-break:break-all;color:${MUTED};">${escapeHtml(url)}</span>`,
    }),
    text: [
      `Reset your password, ${name}.`,
      "",
      "Use this link to choose a new password:",
      url,
      "",
      "The link expires in one hour and can be used once.",
      "If you did not request a reset, no action is needed.",
    ].join("\n"),
  };
}

export function willSubmittedTemplate(
  name: string,
  reference: string,
  url: string,
) {
  return {
    subject: `Your Will ${reference} has been submitted for review`,
    html: layout({
      preheader: `Will ${reference} is now with our review team.`,
      heading: "Your Will is with counsel.",
      body: `Thank you, ${escapeHtml(name)}. Your Will <strong>${escapeHtml(reference)}</strong> has been submitted and is now queued for review. You will be notified as soon as the review is complete.`,
      ctaLabel: "View your Will",
      ctaHref: url,
      footnote:
        "Remember: a Will takes legal effect only once signed by you in the simultaneous presence of your two witnesses.",
    }),
    text: [
      `Thank you, ${name}.`,
      "",
      `Your Will ${reference} has been submitted and is queued for review.`,
      url,
      "",
      "A Will takes legal effect only once signed in the presence of your two witnesses.",
    ].join("\n"),
  };
}

export function reviewReminderTemplate(
  name: string,
  reference: string,
  reason: string,
  url: string,
) {
  return {
    subject: "A reminder to review your Will",
    html: layout({
      preheader: "Life changes. Your Will should keep up.",
      heading: "Time to review your Will.",
      body: `${escapeHtml(name)}, it is good practice to revisit your Will ${escapeHtml(reason)}. Your current document is <strong>${escapeHtml(reference)}</strong>.`,
      ctaLabel: "Review my Will",
      ctaHref: url,
      footnote:
        "We recommend a review every 12 months, and after any marriage, birth of a child, or acquisition of property.",
    }),
    text: [
      `${name}, it is good practice to revisit your Will ${reason}.`,
      "",
      `Current document: ${reference}`,
      url,
      "",
      "We recommend a review every 12 months, and after any marriage, birth of a child, or acquisition of property.",
    ].join("\n"),
  };
}

export function contactAcknowledgementTemplate(name: string, subject: string) {
  return {
    subject: "We have received your message",
    html: layout({
      preheader: "Thank you for contacting Castle eWill & Trust.",
      heading: "Thank you for writing to us.",
      body: `${escapeHtml(name)}, we have received your message regarding &ldquo;${escapeHtml(subject)}&rdquo; and a member of our team will respond shortly.`,
      footnote: `If your matter is urgent, please call ${escapeHtml(COMPANY.phone)}.`,
    }),
    text: [
      `${name}, thank you for writing to us.`,
      "",
      `We have received your message regarding "${subject}" and will respond shortly.`,
      "",
      `If your matter is urgent, please call ${COMPANY.phone}.`,
    ].join("\n"),
  };
}

export function willApprovedTemplate(
  name: string,
  reference: string,
  url: string,
) {
  return {
    subject: `Your Will ${reference} has been approved`,
    html: layout({
      preheader: `Will ${reference} has passed review.`,
      heading: "Your Will has been approved.",
      body: `${escapeHtml(name)}, your Will <strong>${escapeHtml(reference)}</strong> has completed review. You can now download the final document and arrange signing.`,
      ctaLabel: "Download your Will",
      ctaHref: url,
      footnote:
        "Print the Will and sign it in the simultaneous presence of both witnesses, who must then sign in your presence. Until it is signed in this way it has no legal effect.",
    }),
    text: [
      `${name}, your Will ${reference} has completed review.`,
      "",
      "Download the final document here:",
      url,
      "",
      "Print it and sign in the simultaneous presence of both witnesses, who must then sign in your presence. Until signed in this way it has no legal effect.",
    ].join("\n"),
  };
}

export function willChangesRequestedTemplate(
  name: string,
  reference: string,
  reason: string,
  url: string,
) {
  return {
    subject: `Changes requested on your Will ${reference}`,
    html: layout({
      preheader: `Will ${reference} needs a small amendment.`,
      heading: "A few changes are needed.",
      body: `${escapeHtml(name)}, our reviewer has looked at Will <strong>${escapeHtml(reference)}</strong> and asked for the following:<br><br><em>${escapeHtml(reason)}</em><br><br>Your Will has been returned to draft so you can make the amendment.`,
      ctaLabel: "Amend your Will",
      ctaHref: url,
      footnote:
        "Nothing you entered has been lost — every section is exactly as you left it.",
    }),
    text: [
      `${name}, our reviewer has asked for changes on Will ${reference}:`,
      "",
      reason,
      "",
      "Your Will has been returned to draft so you can amend it:",
      url,
      "",
      "Nothing you entered has been lost.",
    ].join("\n"),
  };
}
