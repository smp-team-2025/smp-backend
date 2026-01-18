import { PrismaClient, UserRole } from "@prisma/client";
import { isSimilar } from "../../services/nameMatch";
import type { ZoomCsvRow } from "../../services/zoomCsv";

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

  private async matchParticipant(row: ZoomCsvRow) {
    if (row.email) {
      const byEmail = await prisma.user.findUnique({
        where: { email: row.email },
      });
      if (byEmail) return byEmail;
    }

    // name matching if no email
    if (!row.name) return null;

    const candidates = await prisma.user.findMany({
      where: {
        role: UserRole.PARTICIPANT,
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (const user of candidates) {
      if (isSimilar(user.name, row.name)) {
        return user;
      }
    }

    return null;
  }

  async importZoomCsv({
    sessionId,
    rows,
  }: {
    sessionId: number;
    rows: ZoomCsvRow[];
  }) {
    const unmatched: ZoomCsvRow[] = [];
    let matchedCount = 0;

    for (const row of rows) {
      const user = await this.matchParticipant(row);

      if (!user) {
        unmatched.push(row);
        continue;
      }

      await prisma.attendance.upsert({
        where: {
          participantId_sessionId: {
            participantId: user.id,
            sessionId,
          },
        },
        create: {
          participantId: user.id,
          sessionId,
       },
        update: {},
     });

     matchedCount++;
    }

    if (unmatched.length > 0) {
      await prisma.zoomUnmatchedParticipant.createMany({
        data: unmatched.map((u) => ({
          sessionId,
          displayName: u.name,
          email: u.email ?? null,
        })),
      });
    }

    return {
      matchedCount,
      unmatchedCount: unmatched.length,
    };
  }

  async getZoomUnmatched(sessionId: number) {
    return prisma.zoomUnmatchedParticipant.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  }
};

export const attendanceService = new AttendanceService();