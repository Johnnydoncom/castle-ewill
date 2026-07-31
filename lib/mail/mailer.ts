import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getEnv } from "@/lib/env";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

let transporter: Transporter | null | undefined;

/**
 * Returns the SMTP transport, or null when SMTP is not configured.
 *
 * A missing SMTP_HOST is treated as "development mode": messages are logged to
 * the console instead of being sent, so the app runs end-to-end locally without
 * credentials. In production a missing host is a hard error — silently dropping
 * a password-reset email would be worse than failing loudly.
 */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const env = getEnv();

  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "SMTP_HOST is required in production so that verification and password-reset email can be delivered.",
      );
    }
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    pool: true,
    maxConnections: 3,
  });

  return transporter;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const env = getEnv();
  const transport = getTransporter();

  if (!transport) {
    console.info(
      [
        "",
        "───────────────────────── EMAIL (dev, not sent) ─────────────────────────",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        "─────────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  await transport.sendMail({
    from: env.MAIL_FROM,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo ?? env.MAIL_REPLY_TO,
  });
}

/** Verifies SMTP connectivity — used by the admin settings health check. */
export async function verifyMailConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const transport = getTransporter();
    if (!transport) return { ok: false, error: "SMTP is not configured" };
    await transport.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}

/** Test seam. */
export function resetMailer(): void {
  transporter = undefined;
}
