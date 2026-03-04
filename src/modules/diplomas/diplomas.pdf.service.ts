import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";
import path from "node:path";

import { diplomaService } from "./diplomas.service";
import { AttendanceSource } from "@prisma/client";

type ParticipationMode = "ONSITE" | "ONLINE" | "HYBRID";

function safeAssetPath(relativeFromRepoRoot: string) {
  return path.resolve(process.cwd(), relativeFromRepoRoot);
}

function formatDateFull(date: Date) {
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

function winterSemesterLabel(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0..11
  // Rough rule: Oct–Mar is WS of y/(y+1). Otherwise, still label as WS of y/(y+1).
  const startYear = m >= 9 ? y : y - 1;
  const endYear2 = (startYear + 1).toString().slice(-2);
  return `${startYear}/${endYear2}`;
}

function inferMode(attSources: AttendanceSource[]): ParticipationMode {
  const hasOnsite = attSources.includes(AttendanceSource.ONSITE);
  const hasOnline = attSources.includes(AttendanceSource.ONLINE);
  if (hasOnsite && hasOnline) return "HYBRID";
  if (hasOnline) return "ONLINE";
  return "ONSITE";
}

function drawSpacedText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
) {
  let cx = x;
  for (const ch of text) {
    doc.text(ch, cx, y, { lineBreak: false });
    cx += doc.widthOfString(ch) + letterSpacing;
  }
}

export const diplomaPdfService = {
  async generateDiplomaPdf(
    participantId: number,
    eventId: number
  ): Promise<{ pdf: Buffer; fileName: string }> {
    const diploma = await diplomaService.getDiploma(participantId, eventId);
    if (!diploma) {
      const err: any = new Error("DIPLOMA_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    const participantName = diploma.participant.name;
    const certificateNumber = diploma.certificateNumber;

    const sessions = (diploma.event as any).sessions ?? [];
    const sessionTitles: string[] = sessions.map((s: any) => s.title);

    const attendanceSources: AttendanceSource[] = (diploma.participant as any)
      .attendances?.map((a: any) => a.source) ?? [AttendanceSource.ONSITE];

    const mode = inferMode(attendanceSources);

    const endRefDate =
      (diploma.event.endDate && new Date(diploma.event.endDate)) ||
      (sessions.length > 0
        ? new Date(sessions[sessions.length - 1].startsAt)
        : new Date(diploma.issuedAt));

    const ws = winterSemesterLabel(endRefDate);
    const location = (diploma.event as any).diplomaLocation ?? "Darmstadt";

    // A4 portrait
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Layout constants (tuned to match provided Diplome.pdf)
    const pageW = 595.28;
    const left = 78;
    const top = 56;
    const red = "#e30613";

    // --- Header (TU logo + text) ---
    const tudLogoPath = safeAssetPath("src/assets/diploma/tud_smp_logo.jpeg");
    doc.save();
    doc.rect(left - 60, top - 10, 420, 105).clip();
    try {
      doc.image(tudLogoPath, left - 70, top - 22, { width: 440 });
    } catch {
      // If asset missing, just continue (keeps generation working)
    }
    doc.restore();

    // --- DIPLOM + SMP ---
    doc.fillColor(red);
    doc.font("Times-Roman").fontSize(88);
    // draw with letter spacing similar to sample
    drawSpacedText(doc, "D I P L O M",79, 196, 4.2);

    doc.font("Times-Roman").fontSize(18);
    doc.text("SMP", pageW - left - 140, 270, { width: 190, align: "right" });

    // --- Body text ---
    doc.fillColor("#000000");
    doc.font("Helvetica").fontSize(12);

    let y = 290;
    const lineGap = 6;
    const bodyWidth = pageW - left * 2;

    doc.text("Die Technische Universität Darmstadt", left, y, {
      width: bodyWidth,
    });
    y += 18 + lineGap;

    doc.font("Helvetica").fontSize(12);
    doc.text("verleiht durch diese Urkunde", left, y, { width: bodyWidth });
    y += 24;

    doc.font("Helvetica-Bold").fontSize(22);
    doc.text(participantName, left, y, { width: bodyWidth });
    y += 24;

    
    doc.font("Helvetica").fontSize(12);

const participationLine =
  mode === "ONSITE"
    ? "für die erfolgreiche Teilnahme an dem sechswöchigen Kursus"
    : mode === "ONLINE"
      ? "für die erfolgreiche Teilnahme an dem sechswöchigen Kursus per Zoom"
      : "für die erfolgreiche hybride Teilnahme an dem sechswöchigen Kursus";

doc.text(participationLine, left, y, { width: bodyWidth });
y += 18;

// 2) line: winter semester + purpose (Modern Physics)
doc.font("Helvetica").fontSize(12);
doc.text(`im Wintersemester ${ws} zum Verständnis der Modernen Physik`, left, y, {
  width: bodyWidth,
});
y += 18;

// 3) line: topics intro
doc.font("Helvetica").fontSize(12);
doc.text("mit den Themen:", left, y, { width: bodyWidth });
y += 18;

    doc.font("Helvetica").fontSize(12.5);
    const bulletIndent = 12;
    for (const t of sessionTitles) {
      doc.text(`- ${t}`, left + bulletIndent, y, {
        width: bodyWidth - bulletIndent,
      });
      y = doc.y + 2;
      // Keep space for signatures
      if (y > 610) break;
    }

    // --- Date line ---
    const dateStr =
      mode === "ONSITE"
        ? `${location}, ${formatDateFull(endRefDate)}`
        : `${location}, im ${formatMonthYear(endRefDate)}`;

    doc.font("Helvetica").fontSize(12.5);
    doc.text(dateStr, left, 664, { width: bodyWidth });

    // --- Signatures ---
    const sigY = 705;
    const sigLineY = sigY + 18;

    const colGap = 70;
    const colW = (bodyWidth - colGap) / 2;
    const col1X = left;
    const col2X = left + colW + colGap;

    const signer1Name = (diploma.event as any).diplomaSigner1Name;
    const signer1Role = (diploma.event as any).diplomaSigner1Role;
    const signer1Sig = (diploma.event as any).diplomaSigner1SignatureUrl;

    const signer2Name = (diploma.event as any).diplomaSigner2Name;
    const signer2Role = (diploma.event as any).diplomaSigner2Role;
    const signer2Sig = (diploma.event as any).diplomaSigner2SignatureUrl;

    const fallbackWalther = safeAssetPath(
      "src/assets/diploma/signature_walther.jpeg"
    );

    const signer1SigResolved =
      signer1Sig ?? (signer2Sig ? signer2Sig : fallbackWalther);
    const signer2SigResolved = signer2Sig ?? fallbackWalther;

    // signature images (above line)
    const sigImgY = sigY - 6;
    try {
      doc.image(signer1SigResolved, col1X + 12, sigImgY - 28, { width: 170 });
    } catch {
      // ignore
    }
    try {
      doc.image(signer2SigResolved, col2X + 12, sigImgY - 28, { width: 170 });
    } catch {
      // ignore
    }

    // signature lines
    doc
      .moveTo(col1X, sigLineY)
      .lineTo(col1X + colW, sigLineY)
      .stroke("#000000");
    doc
      .moveTo(col2X, sigLineY)
      .lineTo(col2X + colW, sigLineY)
      .stroke("#000000");

    doc.font("Helvetica").fontSize(11);
    doc.text(
      [signer1Name, signer1Role].filter(Boolean).join(", ") ||
        "Mitglied des Präsidiums der TU Darmstadt",
      col1X,
      sigLineY + 6,
      { width: colW }
    );
    doc.text(
      [signer2Name, signer2Role].filter(Boolean).join(", ") ||
        "Verantwortliche:r des Fachbereichs",
      col2X,
      sigLineY + 6,
      { width: colW }
    );

    // small certificate number (optional)
    doc.font("Helvetica").fontSize(9).fillColor("#444444");
    doc.text(`Nr. ${certificateNumber}`, left, 815, { width: bodyWidth });

    doc.end();
    const pdf = await done;

    return {
      pdf,
      fileName: `diploma-${certificateNumber}.pdf`,
    };
  },
};