import "server-only";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import { COMPANY } from "@/lib/company";
import type { FullWill } from "./repository";

/**
 * Generates the formatted Will document.
 *
 * pdf-lib draws text at absolute coordinates and has no concept of flow, so
 * this module implements the layout: measured word wrapping, orphan-free page
 * breaks, running headers and numbered clauses.
 */

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait, points
const MARGIN = { top: 72, bottom: 78, left: 72, right: 72 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const INK = rgb(0.09, 0.11, 0.18);
const MUTED = rgb(0.42, 0.45, 0.53);
const RULE = rgb(0.78, 0.8, 0.85);

type Fonts = {
  serif: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
  sans: PDFFont;
};

class Layout {
  private page: PDFPage;
  private y: number;
  private pageNumber = 1;
  private readonly pages: PDFPage[] = [];

  constructor(
    private readonly doc: PDFDocument,
    private readonly fonts: Fonts,
    private readonly reference: string,
  ) {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.pages.push(this.page);
    this.y = PAGE.height - MARGIN.top;
    this.drawRunningHeader();
  }

  private drawRunningHeader(): void {
    if (this.pageNumber === 1) return;
    this.page.drawText(`Last Will and Testament — ${this.reference}`, {
      x: MARGIN.left,
      y: PAGE.height - 46,
      size: 8,
      font: this.fonts.sans,
      color: MUTED,
    });
    this.page.drawLine({
      start: { x: MARGIN.left, y: PAGE.height - 56 },
      end: { x: PAGE.width - MARGIN.right, y: PAGE.height - 56 },
      thickness: 0.5,
      color: RULE,
    });
  }

  private newPage(): void {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.pages.push(this.page);
    this.pageNumber += 1;
    this.y = PAGE.height - MARGIN.top;
    this.drawRunningHeader();
  }

  /** Reserves vertical space, breaking to a new page when it will not fit. */
  private reserve(height: number): void {
    if (this.y - height < MARGIN.bottom) this.newPage();
  }

  space(amount: number): void {
    this.y -= amount;
  }

  /** Splits text into lines that fit `maxWidth` at the given font and size. */
  private wrap(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
  ): string[] {
    const lines: string[] = [];

    for (const paragraph of text.split("\n")) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }

      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);

        // A single word longer than the measure (e.g. a long reference) is
        // broken by character rather than allowed to bleed into the margin.
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = "";
          for (const char of word) {
            if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk += char;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
      if (line) lines.push(line);
    }

    return lines;
  }

  paragraph(
    text: string,
    options: {
      font?: PDFFont;
      size?: number;
      leading?: number;
      indent?: number;
      align?: "left" | "center";
      color?: ReturnType<typeof rgb>;
      spaceAfter?: number;
    } = {},
  ): void {
    const font = options.font ?? this.fonts.serif;
    const size = options.size ?? 11;
    const leading = options.leading ?? size * 1.55;
    const indent = options.indent ?? 0;
    const color = options.color ?? INK;
    const width = CONTENT_WIDTH - indent;

    for (const line of this.wrap(text, font, size, width)) {
      this.reserve(leading);
      const lineWidth = font.widthOfTextAtSize(line, size);
      const x =
        options.align === "center"
          ? MARGIN.left + (CONTENT_WIDTH - lineWidth) / 2
          : MARGIN.left + indent;

      this.page.drawText(line, { x, y: this.y - size, size, font, color });
      this.y -= leading;
    }

    this.y -= options.spaceAfter ?? 6;
  }

  /** Numbered clause: roman numeral heading followed by the clause body. */
  clause(numeral: string, heading: string, body?: string): void {
    // Keep the heading with at least two lines of its body.
    this.reserve(58);
    this.paragraph(`${numeral}.  ${heading.toUpperCase()}`, {
      font: this.fonts.serifBold,
      size: 10.5,
      spaceAfter: 4,
    });
    if (body) this.paragraph(body, { indent: 18, spaceAfter: 12 });
  }

  bullet(text: string): void {
    this.reserve(20);
    this.page.drawText("—", {
      x: MARGIN.left + 18,
      y: this.y - 11,
      size: 11,
      font: this.fonts.serif,
      color: MUTED,
    });
    this.paragraph(text, { indent: 36, spaceAfter: 2 });
  }

  rule(): void {
    this.reserve(18);
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y - 6 },
      end: { x: PAGE.width - MARGIN.right, y: this.y - 6 },
      thickness: 0.5,
      color: RULE,
    });
    this.y -= 18;
  }

  /** Signature rule with a caption beneath it. */
  signatureLine(caption: string, width = 260): void {
    this.reserve(52);
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y - 14 },
      end: { x: MARGIN.left + width, y: this.y - 14 },
      thickness: 0.75,
      color: INK,
    });
    this.page.drawText(caption, {
      x: MARGIN.left,
      y: this.y - 26,
      size: 8.5,
      font: this.fonts.sans,
      color: MUTED,
    });
    this.y -= 46;
  }

  /** Stamps page numbers and the document footer once the flow is complete. */
  finish(generatedAt: Date, version: number): void {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      const footer = `${COMPANY.legalName} · RC ${COMPANY.rcNumber}`;
      const meta = `Document ${this.reference} · Revision ${version} · ${generatedAt.toISOString().slice(0, 10)} · Page ${index + 1} of ${total}`;

      page.drawLine({
        start: { x: MARGIN.left, y: MARGIN.bottom - 22 },
        end: { x: PAGE.width - MARGIN.right, y: MARGIN.bottom - 22 },
        thickness: 0.5,
        color: RULE,
      });
      page.drawText(footer, {
        x: MARGIN.left,
        y: MARGIN.bottom - 36,
        size: 7.5,
        font: this.fonts.sans,
        color: MUTED,
      });
      const metaWidth = this.fonts.sans.widthOfTextAtSize(meta, 7.5);
      page.drawText(meta, {
        x: PAGE.width - MARGIN.right - metaWidth,
        y: MARGIN.bottom - 36,
        size: 7.5,
        font: this.fonts.sans,
        color: MUTED,
      });
    });
  }
}

function formatAddress(will: FullWill): string {
  return [
    will.addressLine1,
    will.addressLine2,
    [will.city, will.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(", ");
}

function formatShare(value: string): string {
  const numeric = Number(value);
  return Number.isInteger(numeric)
    ? `${numeric}%`
    : `${numeric.toFixed(2).replace(/0$/, "")}%`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "____________________";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Renders the Will to a PDF buffer.
 *
 * `draft` overlays a watermark and a notice so an unsigned working copy can
 * never be mistaken for the executed document.
 */
export async function generateWillPdf(
  will: FullWill,
  options: { draft?: boolean; generatedAt?: Date } = {},
): Promise<Buffer> {
  const draft = options.draft ?? will.status === "draft";
  const generatedAt = options.generatedAt ?? new Date();

  const doc = await PDFDocument.create();
  doc.setTitle(`Last Will and Testament — ${will.reference}`);
  doc.setAuthor(will.fullLegalName ?? COMPANY.legalName);
  doc.setProducer(COMPANY.legalName);
  doc.setCreator(COMPANY.name);
  doc.setCreationDate(generatedAt);

  const fonts: Fonts = {
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    sans: await doc.embedFont(StandardFonts.Helvetica),
  };

  const layout = new Layout(doc, fonts, will.reference);
  const testator = will.fullLegalName ?? "____________________";
  const address = formatAddress(will) || "____________________";

  /* ------------------------------ Title block ---------------------------- */

  layout.paragraph(COMPANY.legalName.toUpperCase(), {
    font: fonts.sans,
    size: 8,
    align: "center",
    color: MUTED,
    spaceAfter: 14,
  });
  layout.paragraph("LAST WILL AND TESTAMENT", {
    font: fonts.serifBold,
    size: 20,
    align: "center",
    spaceAfter: 4,
  });
  layout.paragraph(`of ${testator}`, {
    font: fonts.serifItalic,
    size: 13,
    align: "center",
    spaceAfter: 10,
  });
  layout.rule();

  if (draft) {
    layout.paragraph(
      "DRAFT — NOT YET EXECUTED. This copy has no legal effect until it is signed by the testator in the simultaneous presence of both witnesses, who must then sign in the presence of the testator.",
      { font: fonts.serifItalic, size: 9.5, color: MUTED, spaceAfter: 14 },
    );
  }

  /* -------------------------------- Clauses ------------------------------ */

  layout.clause(
    "I",
    "Declaration",
    `I, ${testator}, of ${address}, born on ${formatDate(will.dateOfBirth)}, being of sound mind, memory and understanding, and being of full legal age, DECLARE this to be my Last Will and Testament.`,
  );

  if (will.revokesPriorWills) {
    layout.clause(
      "II",
      "Revocation",
      "I HEREBY REVOKE all Wills, codicils and other testamentary dispositions previously made by me, and declare this instrument alone to contain my testamentary wishes.",
    );
  }

  const primaryExecutors = will.executors.filter((e) => !e.isAlternate);
  const alternateExecutors = will.executors.filter((e) => e.isAlternate);

  if (primaryExecutors.length > 0) {
    layout.clause(
      "III",
      "Appointment of executors",
      "I APPOINT the following person(s) to be the Executor(s) of this my Will, to gather in my estate, discharge my lawful debts, funeral and testamentary expenses, and distribute the residue in accordance with the provisions set out below:",
    );
    for (const executor of primaryExecutors) {
      layout.bullet(
        `${executor.fullName}${executor.relationship ? ` (${executor.relationship})` : ""}, of ${executor.address}.`,
      );
    }
    if (alternateExecutors.length > 0) {
      layout.space(4);
      layout.paragraph(
        "Should any of the above be unable or unwilling to act, I appoint in their place:",
        { indent: 18, size: 10.5, font: fonts.serifItalic, spaceAfter: 4 },
      );
      for (const executor of alternateExecutors) {
        layout.bullet(`${executor.fullName}, of ${executor.address}.`);
      }
    }
    layout.space(8);
  }

  if (will.hasMinorChildren && will.guardians.length > 0) {
    const primaryGuardians = will.guardians.filter((g) => !g.isAlternate);
    const alternateGuardians = will.guardians.filter((g) => g.isAlternate);

    layout.clause(
      "IV",
      "Appointment of guardians",
      "IF at my death any of my children are under the age of eighteen years, I APPOINT the following to be their Guardian:",
    );
    for (const guardian of primaryGuardians) {
      layout.bullet(
        `${guardian.fullName}${guardian.relationship ? ` (${guardian.relationship})` : ""}, of ${guardian.address}${guardian.childrenCovered ? `, in respect of ${guardian.childrenCovered}` : ""}.`,
      );
    }
    for (const guardian of alternateGuardians) {
      layout.bullet(
        `In the alternative, ${guardian.fullName}, of ${guardian.address}.`,
      );
    }
    layout.space(8);
  }

  if (will.bequests.length > 0) {
    layout.clause(
      "V",
      "Specific bequests",
      "I GIVE the following specific items free of all taxes and duties:",
    );
    for (const bequest of will.bequests) {
      layout.bullet(
        `${bequest.itemDescription} — to ${bequest.recipientName}${bequest.recipientRelationship ? ` (${bequest.recipientRelationship})` : ""}.${bequest.notes ? ` ${bequest.notes}` : ""}`,
      );
    }
    layout.space(8);
  }

  if (will.assets.length > 0) {
    layout.clause(
      "VI",
      "Schedule of assets",
      "For the assistance of my Executors, I record the following assets as forming part of my estate at the date of this Will. This schedule is descriptive and does not limit the estate.",
    );
    for (const asset of will.assets) {
      layout.bullet(
        `${asset.description}${asset.institution ? `, held with ${asset.institution}` : ""}${asset.identifier ? ` (ref. ${asset.identifier})` : ""}.`,
      );
    }
    layout.space(8);
  }

  const primaryBeneficiaries = will.beneficiaries.filter((b) => !b.isContingent);
  const contingentBeneficiaries = will.beneficiaries.filter((b) => b.isContingent);

  if (primaryBeneficiaries.length > 0) {
    layout.clause(
      "VII",
      "Residuary estate",
      "I GIVE, DEVISE AND BEQUEATH the whole of the residue of my estate, both real and personal, of whatever nature and wheresoever situate, after payment of my debts, funeral and testamentary expenses, unto the following persons in the shares set against their names:",
    );
    for (const beneficiary of primaryBeneficiaries) {
      layout.bullet(
        `${beneficiary.fullName} (${beneficiary.relationship}) — ${formatShare(beneficiary.sharePercent)}.${beneficiary.notes ? ` ${beneficiary.notes}` : ""}`,
      );
    }
    if (contingentBeneficiaries.length > 0) {
      layout.space(4);
      layout.paragraph(
        "Should any beneficiary named above predecease me, their share shall pass to:",
        { indent: 18, size: 10.5, font: fonts.serifItalic, spaceAfter: 4 },
      );
      for (const beneficiary of contingentBeneficiaries) {
        layout.bullet(
          `${beneficiary.fullName} (${beneficiary.relationship}).`,
        );
      }
    }
    layout.space(8);
  }

  if (will.residuaryEstate) {
    layout.clause("VIII", "Further directions as to residue", will.residuaryEstate);
  }

  if (will.funeralPreference) {
    const preference =
      will.funeralPreference === "burial"
        ? "I DESIRE that my body be buried."
        : will.funeralPreference === "cremation"
          ? "I DESIRE that my body be cremated."
          : "I have recorded particular wishes as to my final arrangements.";

    layout.clause(
      "IX",
      "Funeral and burial wishes",
      `${preference}${will.funeralInstructions ? ` ${will.funeralInstructions}` : ""} These wishes are expressed as guidance to my Executors and family and are not intended to bind them.`,
    );
  }

  if (will.specialInstructions) {
    layout.clause("X", "Special instructions", will.specialInstructions);
  }

  /* ----------------------------- Attestation ----------------------------- */

  layout.space(10);
  layout.rule();
  layout.paragraph("ATTESTATION", {
    font: fonts.serifBold,
    size: 11,
    spaceAfter: 8,
  });
  layout.paragraph(
    `IN WITNESS WHEREOF I, ${testator}, have hereunto set my hand to this my Last Will and Testament, contained in this and the preceding pages, on the ______ day of ____________________, ${generatedAt.getUTCFullYear()}.`,
    { spaceAfter: 22 },
  );

  layout.signatureLine("Signature of testator");

  layout.paragraph(
    "SIGNED by the above-named testator as and for their Last Will and Testament in our presence, both being present at the same time, who at their request and in their presence and in the presence of each other have hereunto subscribed our names as witnesses.",
    { size: 10.5, spaceAfter: 18 },
  );

  const attestingWitnesses =
    will.witnesses.length > 0
      ? will.witnesses
      : ([{ fullName: "", occupation: "", address: "" }] as Array<
          Pick<FullWill["witnesses"][number], "fullName" | "occupation" | "address">
        >);

  attestingWitnesses.forEach((witness, index) => {
    layout.paragraph(`Witness ${index + 1}`, {
      font: fonts.serifBold,
      size: 10,
      spaceAfter: 4,
    });
    layout.paragraph(
      `Name: ${witness.fullName || "____________________"}\nOccupation: ${witness.occupation || "____________________"}\nAddress: ${witness.address || "____________________"}`,
      { size: 10, spaceAfter: 10 },
    );
    layout.signatureLine(`Signature of witness ${index + 1}`, 220);
  });

  layout.space(6);
  layout.paragraph(
    "Note: no person who witnesses this Will, nor the spouse of such a person, may take any benefit under it. A gift to an attesting witness is void, although the Will itself remains valid.",
    { font: fonts.serifItalic, size: 9, color: MUTED },
  );

  layout.finish(generatedAt, will.version);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/** Filename used for downloads and vault storage. */
export function willFileName(will: FullWill): string {
  const name = (will.fullLegalName ?? "will")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${will.reference}-${name || "will"}.pdf`;
}
