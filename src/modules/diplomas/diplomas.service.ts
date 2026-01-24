import { prisma } from "../../prisma";
import { UserRole } from "@prisma/client";

const MINIMUM_ATTENDANCE_COUNT = 3;

type EligibilityResult = {
  isEligible: boolean;
  attendanceCount: number;
  quizSubmitted: boolean;
  requiredAttendance: number;
  reasons?: string[];
};

/**
 * Generate certificate number
 * Format: SMP-{YEAR}-{SEQUENTIAL}
 * Example: SMP-2026-001, SMP-2026-002
 */
async function generateCertificateNumber(eventId: number): Promise<string> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { startDate: true },
  });

  const year = event?.startDate
    ? new Date(event.startDate).getFullYear()
    : new Date().getFullYear();

  const count = await prisma.diploma.count({
    where: { eventId },
  });

  const sequential = (count + 1).toString().padStart(3, "0");
  return `SMP-${year}-${sequential}`;
}

export const diplomaService = {
  async checkEligibility(
    participantId: number,
    eventId: number
  ): Promise<EligibilityResult> {
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.role !== UserRole.PARTICIPANT) {
      throw new Error("INVALID_PARTICIPANT");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    const sessions = await prisma.session.findMany({
      where: { eventId },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    const attendanceCount = await prisma.attendance.count({
      where: {
        participantId,
        sessionId: { in: sessionIds },
      },
    });

    const quizSubmitted =
      (await prisma.fermiResponse.count({
        where: {
          participantId,
          quiz: {
            session: {
              eventId,
            },
          },
        },
      })) > 0;

    const reasons: string[] = [];
    const isEligible =
      attendanceCount >= MINIMUM_ATTENDANCE_COUNT && quizSubmitted;

    if (attendanceCount < MINIMUM_ATTENDANCE_COUNT) {
      reasons.push(
        `Insufficient attendance: ${attendanceCount}/${MINIMUM_ATTENDANCE_COUNT}`
      );
    }
    if (!quizSubmitted) {
      reasons.push("Quiz not submitted");
    }

    return {
      isEligible,
      attendanceCount,
      quizSubmitted,
      requiredAttendance: MINIMUM_ATTENDANCE_COUNT,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  },

  async issueDiploma(participantId: number, eventId: number) {
    const eligibility = await this.checkEligibility(participantId, eventId);

    if (!eligibility.isEligible) {
      throw new Error("PARTICIPANT_NOT_ELIGIBLE");
    }

    const existing = await prisma.diploma.findUnique({
      where: {
        participantId_eventId: {
          participantId,
          eventId,
        },
      },
    });

    if (existing) {
      throw new Error("DIPLOMA_ALREADY_ISSUED");
    }

    const certificateNumber = await generateCertificateNumber(eventId);

    const diploma = await prisma.diploma.create({
      data: {
        participantId,
        eventId,
        certificateNumber,
      },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
            registration: {
              select: { school: true },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return diploma;
  },

  async getDiploma(participantId: number, eventId: number) {
    return prisma.diploma.findUnique({
      where: {
        participantId_eventId: {
          participantId,
          eventId,
        },
      },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
            registration: {
              select: { school: true },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
  },

  async getDiplomaByCertificateNumber(certificateNumber: string) {
    return prisma.diploma.findUnique({
      where: { certificateNumber },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
            registration: {
              select: { school: true },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
  },

  async listEligibleParticipants(eventId: number) {
    const participants = await prisma.user.findMany({
      where: {
        role: UserRole.PARTICIPANT,
        attendances: {
          some: {
            session: {
              eventId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        registration: {
          select: { school: true },
        },
      },
    });

    const eligibilityChecks = await Promise.all(
      participants.map(async (p) => {
        const eligibility = await this.checkEligibility(p.id, eventId);
        const diploma = await this.getDiploma(p.id, eventId);

        return {
          participant: p,
          eligibility,
          diplomaIssued: !!diploma,
          diploma,
        };
      })
    );

    return eligibilityChecks.filter((c) => c.eligibility.isEligible);
  },

  async listIssuedDiplomas(eventId: number) {
    return prisma.diploma.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
            registration: {
              select: { school: true },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });
  },

  async getParticipantDiplomas(participantId: number) {
    return prisma.diploma.findMany({
      where: { participantId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });
  },

  async deleteDiploma(participantId: number, eventId: number) {
    const diploma = await this.getDiploma(participantId, eventId);

    if (!diploma) {
      throw new Error("DIPLOMA_NOT_FOUND");
    }

    await prisma.diploma.delete({
      where: {
        participantId_eventId: {
          participantId,
          eventId,
        },
      },
    });

    return true;
  },

  async getEventStatistics(eventId: number) {
    const [totalParticipants, issuedDiplomas, eligibleParticipants] =
      await Promise.all([
        prisma.user.count({
          where: {
            role: UserRole.PARTICIPANT,
            attendances: {
              some: {
                session: {
                  eventId,
                },
              },
            },
          },
        }),
        prisma.diploma.count({
          where: { eventId },
        }),
        this.listEligibleParticipants(eventId),
      ]);

    return {
      eventId,
      totalParticipants,
      issuedDiplomas,
      eligibleNotIssued: eligibleParticipants.filter((p) => !p.diplomaIssued)
        .length,
      eligibleTotal: eligibleParticipants.length,
    };
  },
};