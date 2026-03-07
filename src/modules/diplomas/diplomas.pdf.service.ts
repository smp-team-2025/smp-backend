import PDFDocument from "pdfkit";
import fs from "node:fs";
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

function fileExists(p: string | null | undefined) {
  return !!p && fs.existsSync(p);
}

function resolveStoredUploadPath(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;

  if (path.isAbsolute(urlOrPath) && fileExists(urlOrPath)) {
    return urlOrPath;
  }

  const normalized = urlOrPath.replace(/\\/g, "/");

  if (normalized.startsWith("/uploads/")) {
    const rel = normalized.replace(/^\/+/, "");
    const candidate = path.resolve(process.cwd(), rel);
    if (fileExists(candidate)) return candidate;
  }

  if (normalized.startsWith("uploads/")) {
    const candidate = path.resolve(process.cwd(), normalized);
    if (fileExists(candidate)) return candidate;
  }

  const base = path.basename(normalized);
  const uploadsCandidate = path.resolve(
    process.cwd(),
    "uploads",
    "diploma-signatures",
    base
  );
  if (fileExists(uploadsCandidate)) return uploadsCandidate;

  return null;
}

function drawSignatureImage(
  doc: PDFKit.PDFDocument,
  imagePath: string | null,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (!imagePath) return;

  try {
    doc.image(imagePath, x, y, {
      fit: [width, height],
      valign: "bottom",
    });
  } catch {
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

    const sessions = ((diploma.event as any).sessions ?? []) as Array<any>;
    const sessionTitles: string[] = sessions
      .map((s) => String(s.title ?? "").trim())
      .filter(Boolean);

    const attendanceSources: AttendanceSource[] =
      ((diploma.participant as any).attendances?.map((a: any) => a.source) ??
        [AttendanceSource.ONSITE]) as AttendanceSource[];

    const mode = inferMode(attendanceSources);

    const endRefDate =
      (diploma.event.endDate && new Date(diploma.event.endDate)) ||
      (sessions.length > 0
        ? new Date(sessions[sessions.length - 1].startsAt)
        : new Date(diploma.issuedAt));

    const ws = winterSemesterLabel(endRefDate);
    const location = (diploma.event as any).diplomaLocation ?? "Darmstadt";

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));

    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const pageW = 595.28;
    const left = 71;
    const red = "#e30613";
    const bodyWidth = pageW - left * 2;

    const tudLogoPath = safeAssetPath("src/assets/diploma/tud.png");
    const fallbackWalther = safeAssetPath(
      "src/assets/diploma/signature_walther.jpeg"
    );

    const signer1Name =
      (diploma.event as any).diplomaSigner1Name || "Prof. Dr. Tanja Brühl";
    const signer1Role =
      (diploma.event as any).diplomaSigner1Role || "Die Präsidentin";

    const signer2Name =
      (diploma.event as any).diplomaSigner2Name || "Prof. Dr. Thomas Walther";
    const signer2Role =
      (diploma.event as any).diplomaSigner2Role || "Fachbereich Physik";

    const signer1StoredPath = resolveStoredUploadPath(
      (diploma.event as any).diplomaSigner1SignatureUrl
    );
    const signer2StoredPath = resolveStoredUploadPath(
      (diploma.event as any).diplomaSigner2SignatureUrl
    );

    const signer1SigPath =
      signer1StoredPath ||
      (fileExists(fallbackWalther) ? fallbackWalther : null);

    const signer2SigPath =
      signer2StoredPath ||
      (fileExists(fallbackWalther) ? fallbackWalther : null);

    //white background
    doc.rect(0, 0, pageW, 841.89).fill("#ffffff");
    doc.fillColor("#000000");

    //Header logo
    try {
      doc.image(tudLogoPath, 20, 16, {
        width: 245,
      });
    } catch {
    }

    //DIPLOM / SMP
    doc.fillColor(red);
    doc.font("Times-Roman").fontSize(88);
    drawSpacedText(doc, "D I P L O M", left, 132, 3.4);

    doc.font("Times-Roman").fontSize(18);
    doc.text("SMP", 500, 197, {
      width: 60,
      align: "left",
      lineBreak: false,
    });

    //Intro block
    doc.fillColor("#000000");
    doc.font("Helvetica").fontSize(12);
    doc.text("Die Technische Universität Darmstadt", left, 228, {
      width: bodyWidth,
      align: "left",
    });
    doc.text("verleiht durch diese Urkunde", left, 245, {
      width: bodyWidth,
      align: "left",
    });

    //Participant name
    doc.font("Helvetica-Bold").fontSize(21);
    doc.text(participantName, left, 293, {
      width: bodyWidth,
      align: "left",
    });

    //Main diploma text block
    let y = 346;

    doc.font("Helvetica").fontSize(12);
    doc.text("das", left, y, { width: bodyWidth, lineBreak: false });
    y += 14;

    // SATURDAY MORNING PHYSICS Diplom
    const smpBaseX = left;

    doc.font("Helvetica-Bold").fontSize(14);
    doc.text("S", smpBaseX, y, { lineBreak: false });

    doc.font("Helvetica").fontSize(14);
    doc.text("ATURDAY ", smpBaseX + 10, y, { lineBreak: false });

    doc.font("Helvetica-Bold").fontSize(14);
    doc.text("M", smpBaseX + 76, y, { lineBreak: false });

    doc.font("Helvetica").fontSize(14);
    doc.text("ORNING ", smpBaseX + 88, y, { lineBreak: false });

    doc.font("Helvetica-Bold").fontSize(14);
    doc.text("P", smpBaseX + 149, y, { lineBreak: false });

    doc.font("Helvetica").fontSize(14);
    doc.text("HYSICS Diplom", smpBaseX + 159, y, { lineBreak: false });

    y += 34;

    doc.font("Helvetica").fontSize(12);

    const participationLine =
      mode === "ONSITE"
        ? "für die erfolgreiche Teilnahme an dem sechswöchigen Kursus"
        : mode === "ONLINE"
          ? "für die erfolgreiche Teilnahme an dem sechswöchigen Kursus per Zoom"
          : "für die erfolgreiche hybride Teilnahme an dem sechswöchigen Kursus";

    doc.text(participationLine, left, y, {
      width: bodyWidth,
      align: "left",
    });
    y += 16;

    doc.text(
      `im Wintersemester ${ws} zum Verständnis der Modernen Physik`,
      left,
      y,
      {
        width: bodyWidth,
        align: "left",
      }
    );
    y += 16;

    doc.text("mit den Themen:", left, y, {
      width: bodyWidth,
      align: "left",
    });
    y += 30;

    //Session titles
    doc.font("Helvetica").fontSize(12);
    for (const title of sessionTitles) {
      const beforeY = y;
      doc.text(title, left, y, {
        width: bodyWidth,
        align: "left",
        lineGap: 2,
      });
      y = doc.y + 6;

      if (y > 620) {
        y = beforeY;
        break;
      }
    }

    //Date line
    const dateStr =
      mode === "ONSITE"
        ? `${location}, ${formatDateFull(endRefDate)}`
        : `${location}, im ${formatMonthYear(endRefDate)}`;

    const dateY = Math.max(y + 20, 660);
    doc.font("Helvetica").fontSize(12);
    doc.text(dateStr, left, dateY, {
      width: bodyWidth,
      align: "left",
    });

    //Signature images
    const sigImgTopY = 724;
    drawSignatureImage(doc, signer1SigPath, left, sigImgTopY, 145, 44);
    drawSignatureImage(doc, signer2SigPath, left + 250, sigImgTopY, 155, 44);
      
    //Signature names / roles
    const labelY = 770;
    doc.font("Helvetica").fontSize(10);

    doc.text(signer1Name, left, labelY, {
      width: 180,
      align: "left",
    });
    doc.text(signer2Name, left + 250, labelY, {
      width: 180,
      align: "left",
    });

    doc.text(signer1Role, left, labelY + 14, {
      width: 180,
      align: "left",
    });
    doc.text(signer2Role, left + 250, labelY + 14, {
      width: 180,
      align: "left",
    });

    doc.end();
    const pdf = await done;

    return {
      pdf,
      fileName: `SMP-Diplom.pdf`,
    };
  },
};