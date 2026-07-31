import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { rateLimit } from "@/lib/auth/rate-limit";
import { callerKey } from "@/lib/security/audit";
import { sendMail } from "@/lib/mail/mailer";
import { contactAcknowledgementTemplate } from "@/lib/mail/templates";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(191),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().max(32).optional(),
  subject: z.string().trim().min(2, "Enter a subject").max(191),
  message: z.string().trim().min(10, "Tell us a little more").max(5000),
});

export async function POST(request: Request) {
  const limit = rateLimit(await callerKey("contact"), 5, 15 * 60);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Malformed request body" },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  await db.insert(contactMessages).values({
    id: newId(),
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  // The acknowledgement is a courtesy; a mail failure must not lose the message
  // that has already been persisted.
  try {
    await sendMail({
      to: parsed.data.email,
      ...contactAcknowledgementTemplate(parsed.data.name, parsed.data.subject),
    });
  } catch (error) {
    console.error("[contact] acknowledgement email failed", error);
  }

  return NextResponse.json(
    { success: true, message: "Thank you — we have received your message." },
    { status: 201 },
  );
}
