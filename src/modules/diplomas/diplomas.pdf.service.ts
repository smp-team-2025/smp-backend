import PDFDocument from "pdfkit";
import { diplomaService } from "./diplomas.service";

export const diplomaPdfService = {
  async generateDiplomaPdf(
    participantId: number,
    eventId: number
  ): Promise<{ pdf: Buffer; fileName: string }> {
    // Get diploma with all related data
    const diploma = await diplomaService.getDiploma(participantId, eventId);

    if (!diploma) {
      const err: any = new Error("DIPLOMA_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    // Get eligibility info for PDF
    const eligibility = await diplomaService.checkEligibility(
      participantId,
      eventId
    );

    const participantName = diploma.participant.name;
    const school = diploma.participant.registration?.school ?? "Unknown School";
    const eventTitle = diploma.event.title;
    const certificateNumber = diploma.certificateNumber;

    // Create PDF document (A4 landscape)
    const doc = new PDFDocument({
      size: [842, 595], // A4 landscape (width x height in points)
      margin: 50,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const centerX = 421; // Center of A4 landscape width

    // Add decorative border
    doc.rect(40, 40, 762, 515).lineWidth(3).stroke("#1e40af"); // Blue border

    doc.rect(50, 50, 742, 495).lineWidth(1).stroke("#1e40af");

    // Header - Certificate title
    doc
      .fontSize(40)
      .font("Helvetica-Bold")
      .fillColor("#1e40af")
      .text("Teilnahmezertifikat", 50, 90, {
        width: 742,
        align: "center",
      });

    // Subtitle
    doc
      .fontSize(20)
      .font("Helvetica")
      .fillColor("#000000")
      .text("Saturday Morning Physics", 50, 150, {
        width: 742,
        align: "center",
      });

    // Event title
    doc
      .fontSize(14)
      .font("Helvetica-Oblique")
      .fillColor("#4b5563")
      .text(eventTitle, 50, 185, {
        width: 742,
        align: "center",
      });

    // Certificate text
    doc
      .fontSize(16)
      .font("Helvetica")
      .fillColor("#000000")
      .text("Dieses Zertifikat wird verliehen an", 50, 230, {
        width: 742,
        align: "center",
      });

    // Participant name (highlighted)
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#1e40af")
      .text(participantName, 50, 270, {
        width: 742,
        align: "center",
      });

    // School
    doc
      .fontSize(14)
      .font("Helvetica-Oblique")
      .fillColor("#000000")
      .text(school, 50, 315, {
        width: 742,
        align: "center",
      });

    // Achievement text
    doc
      .fontSize(14)
      .font("Helvetica")
      .text(
        "für die erfolgreiche Teilnahme am Programm Saturday Morning Physics.",
        50,
        360,
        {
          width: 742,
          align: "center",
        }
      );

    // Criteria details
    doc
      .fontSize(12)
      .text(
        `einschließlich der Teilnahme an den Programmsitzungen`,
        50,
        390,
        {
          width: 742,
          align: "center",
        }
      );

    doc.text("sowie der erfolgreichen Bearbeitung des Fermi-Quiz.", 50, 410, {
      width: 742,
      align: "center",
    });

    // Certificate number
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#1e40af")
      .text(`Zertifikat-Nr.: ${certificateNumber}`, 50, 445, {
        width: 742,
        align: "center",
      });

    // Date
    const issuedDate = new Date(diploma.issuedAt);
    const dateStr = issuedDate.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text(`Ausgestellt am ${dateStr}`, 50, 480, {
        width: 742,
        align: "center",
      });

    // Signature line
    doc
      .moveTo(centerX - 150, 520)
      .lineTo(centerX + 150, 520)
      .stroke("#000000");

    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text("Programmleitung SMP", 50, 530, {
        width: 742,
        align: "center",
      });

    doc.end();

    const pdf = await done;

    return {
      pdf,
      fileName: `diploma-${certificateNumber}.pdf`,
    };
  },
};