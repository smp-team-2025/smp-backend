import { PrismaClient, UserRole } from "@prisma/client";
import { parseZoomCsv } from "../../services/zoomCsv";
import { isSimilar } from "../../services/nameMatch";

const prisma = new PrismaClient();

type ScanInput = {
  qrId: string;
  sessionId: number;
  hiwiUserId: number;
};

class AttendanceService {
    //QR attendance taking by HiWi
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

  //Manual Attendance taking by Organizers
  async manual({
    participantId,
    sessionId,
  }: {
    participantId: number;
    sessionId: number;
  }) {
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.role !== UserRole.PARTICIPANT) {
      throw new Error("INVALID_PARTICIPANT");
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
          participantId,
          sessionId,
        },
      },
    });

    if (existing) {
      throw new Error("ALREADY_PRESENT");
    }

    return prisma.attendance.create({
      data: {
        participantId,
        sessionId,
        scannedByHiwiId: null, // Organizers take manual attendance
      },
    });
  }

  //Removing attendance by Organizers
  async remove(attendanceId: number): Promise<boolean> {
    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!existing) return false;

    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    return true;
  }

  //Participants can get their own attendance
  async getMyAttendance(userId: number) {
    return prisma.attendance.findMany({
      where: {
        participantId: userId,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            location: true,
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        scannedAt: "asc",
      },
    });
  }

  async importZoomCsv({
    sessionId,
    filePath,
  }: {
    sessionId: number;
    filePath: string;
  }) {
    const rows = await parseZoomCsv(filePath);

    const participants = await prisma.user.findMany({
      where: { role: "PARTICIPANT" },
      select: { id: true, name: true, email: true },
    });

    const result = {
      imported: 0,
      skipped: 0,
      unmatched: [] as { name: string; email?: string }[],
    };

    for (const row of rows) {
      let user =
        row.email &&
        participants.find(
          (p) => p.email?.toLowerCase() === row.email?.toLowerCase()
        );

      if (!user) {
        user = participants.find((p) => isSimilar(p.name, row.name));
      }

      if (!user) {
        result.unmatched.push({ name: row.name, email: row.email });
        continue;
      }

      await prisma.attendance.upsert({
        where: {
          participantId_sessionId: {
            participantId: user.id,
            sessionId,
          },
        },
        update: {
          source: "ONLINE",
          zoomDisplayName: row.name,
          zoomEmail: row.email,
          zoomJoinTime: row.joinTime ? new Date(row.joinTime) : null,
          zoomLeaveTime: row.leaveTime ? new Date(row.leaveTime) : null,
          zoomDurationMin: row.durationMin,
        },
        create: {
          participantId: user.id,
          sessionId,
          source: "ONLINE",
          zoomDisplayName: row.name,
          zoomEmail: row.email,
          zoomJoinTime: row.joinTime ? new Date(row.joinTime) : null,
          zoomLeaveTime: row.leaveTime ? new Date(row.leaveTime) : null,
          zoomDurationMin: row.durationMin,
        },
      });

      result.imported++;
    }

    return result;
  }
};

export const attendanceService = new AttendanceService();