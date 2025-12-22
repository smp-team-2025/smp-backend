import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { prisma } from "../../prisma";

export const usersService = {
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      const err: any = new Error("USER_NOT_FOUND");
      err.status = 404;
      throw err;
    }
    return user;
  },

  async getQrCodePngByUserId(userId: number): Promise<{ png: Buffer; fileName: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, qrId: true, email: true },
    });

    if (!user) {
      const err: any = new Error("USER_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    if (!user.qrId) {
      const err: any = new Error("USER_HAS_NO_QRID");
      err.status = 400;
      throw err;
    }

    const payload = `smp:${user.qrId}`;

    const png = await QRCode.toBuffer(payload, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 8,
    });

    return {
      png,
      fileName: `user-${user.id}-qrcode.png`,
    };
  },

  async generateBusinessCardPdf(
    userId: number
  ): Promise<{ pdf: Buffer; fileName: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        qrId: true,
        role: true,
        registration: {
          select: { school: true },
        },
      },
    });

    if (!user) {
      const err: any = new Error("USER_NOT_FOUND");
      err.status = 404;
      throw err;
    }

    if (!user.qrId) {
      const err: any = new Error("USER_HAS_NO_QRID");
      err.status = 400;
      throw err;
    }

    const school = user.registration?.school ?? "Unknown school";
    const qrPayload = `smp:${user.qrId}`;

    const qrPng = await QRCode.toBuffer(qrPayload, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    });

    // PDF Business Card
    const mm = (v: number) => v * 2.83465; // 1mm -> pt
    const width = mm(85);
    const height = mm(55);
    const padding = mm(5);
    const qrSize = mm(25);

    const doc = new PDFDocument({ size: [width, height], margin: 0 });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Layout
    // Left upper sidet: SMP + name + school
    doc.fontSize(12).text("SMP", padding, padding);

    doc.fontSize(11).text(user.name, padding, padding + mm(8), {
      width: width - padding * 2 - qrSize - mm(2),
    });

    doc.fontSize(9).fillColor("#444").text(school, padding, padding + mm(15), {
      width: width - padding * 2 - qrSize - mm(2),
    });
    doc.fillColor("#000");

    // Right down side: QR
    const qrX = width - padding - qrSize;
    const qrY = height - padding - qrSize;
    doc.image(qrPng, qrX, qrY, { width: qrSize, height: qrSize });

    // Left Down side: qrId small (debug/backup)
    doc.fontSize(6).fillColor("#666").text(user.qrId, padding, height - padding - mm(4), {
      width: width - padding * 2 - qrSize - mm(2),
    });
    doc.fillColor("#000");

    doc.end();

    const pdf = await done;

    return {
      pdf,
      fileName: `business-card-user-${user.id}.pdf`,
    };
  },
};