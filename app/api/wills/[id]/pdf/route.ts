import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getFullWill } from "@/lib/will/repository";
import { generateWillPdf, willFileName } from "@/lib/will/pdf";
import { recordAudit } from "@/lib/security/audit";

/**
 * Streams the generated Will as a PDF.
 *
 * Reads are ownership-scoped: a non-admin caller can only ever fetch their own
 * Will, so guessing an id in the URL yields a 404 rather than someone else's
 * document.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const scopeToUser = session.user.role === "admin" ? null : session.user.id;
  const will = await getFullWill(id, scopeToUser);

  if (!will) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await generateWillPdf(will);

  await recordAudit({
    userId: session.user.id,
    action: "will.pdf_downloaded",
    entityType: "will",
    entityId: will.id,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${willFileName(will)}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
