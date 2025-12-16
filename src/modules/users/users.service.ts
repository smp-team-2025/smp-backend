import QRCode from "qrcode";
import { prisma } from "../../prisma";

export const usersService = {
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
};