import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

type ScanInput = {
  qrId: string;
  sessionId: number;
  hiwiUserId: number;
};

class AttendanceService {
  async scan({ qrId, sessionId, hiwiUserId }: ScanInput) {
    // Only HiWi can take attendance
    const hiwi = await prisma.hiWi.findUnique({
      where: { userId: hiwiUserId },
    });

    if (!hiwi) {
      throw new Error("HIWI_NOT_FOUND");
    }

    const participant = await prisma.user.findUnique({
      where: { qrId },
    });

    if (!participant || participant.role !== UserRole.PARTICIPANT) {
      throw new Error("INVALID_QR_CODE");
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    // Duplicate attendance control
    const existing = await prisma.attendance.findUnique({
      where: {
        participantId_sessionId: {
          participantId: participant.id,
          sessionId,
        },
      },
    });

    if (existing) {
      throw new Error("ALREADY_SCANNED");
    }

    return prisma.attendance.create({
      data: {
        participantId: participant.id,
        sessionId,
        scannedByHiwiId: hiwi.id,
      },
    });
  }
}

export const attendanceService = new AttendanceService();