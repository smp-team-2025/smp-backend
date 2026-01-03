import { prisma } from "../../prisma";

type CreateSessionInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string | Date;
  endsAt?: string | Date | null;
};

type UpdateSessionInput = Partial<CreateSessionInput>;

// Required date
function parseRequiredDate(value: any, fieldName: string): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`${fieldName.toUpperCase()}_INVALID_DATE`);
  return d;
}

// Optional non-nullable
function parseOptionalDate(value: any, fieldName: string): Date | undefined {
  if (value === undefined) return undefined;
  if (value === null) throw new Error(`${fieldName.toUpperCase()}_CANNOT_BE_NULL`);
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`${fieldName.toUpperCase()}_INVALID_DATE`);
  return d;
}

// Nullable
function parseNullableDate(value: any, fieldName: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`${fieldName.toUpperCase()}_INVALID_DATE`);
  return d;
}

export const sessionsService = {
  async list(eventId: number) {
    return prisma.session.findMany({
      where: { eventId },
      orderBy: { startsAt: "asc" },
      include: {
        fermiQuiz: {
          select: {
            id: true,
          },
        },
      },
    });
  },

  async getById(eventId: number, sessionId: number) {
    return prisma.session.findFirst({
      where: { id: sessionId, eventId },
    });
  },

  async create(eventId: number, input: CreateSessionInput) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) return null;

    const startsAt = parseRequiredDate(input.startsAt, "startsAt");
    const endsAt = parseNullableDate(input.endsAt, "endsAt");

    return prisma.session.create({
      data: {
        eventId,
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        startsAt,
        endsAt: endsAt ?? null,
      },
    });
  },

  async update(eventId: number, sessionId: number, input: UpdateSessionInput) {
    const existing = await prisma.session.findFirst({
      where: { id: sessionId, eventId },
      select: { id: true },
    });
    if (!existing) return null;

    const startsAt = parseOptionalDate(input.startsAt, "startsAt"); // null not allowed
    const endsAt = parseNullableDate(input.endsAt, "endsAt");       // null allowed

    return prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(input.title !== undefined ? { title: input.title as any } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.location !== undefined ? { location: input.location ?? null } : {}),
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {}),
      },
    });
  },

  async remove(eventId: number, sessionId: number) {
    const existing = await prisma.session.findFirst({
      where: { id: sessionId, eventId },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.session.delete({ where: { id: sessionId } });
    return true;
  },

  async listAssignedHiwis(sessionId: number) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return null;

    const rows = await prisma.hiWiSession.findMany({
      where: { sessionId },
      include: {
        hiwi: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Format for frontend
    return rows.map((r) => ({
      assignmentId: r.id,
      sessionId: r.sessionId,
      hiwiId: r.hiwiId,
      assignedAt: r.createdAt,
      hiwi: {
        id: r.hiwi.id,
        clothingSize: r.hiwi.clothingSize,
        user: r.hiwi.user,
      },
    }));
  },

  async assignHiwi(sessionId: number, hiwiId: number) {
    const [session, hiwi] = await Promise.all([
      prisma.session.findUnique({ where: { id: sessionId } }),
      prisma.hiWi.findUnique({ where: { id: hiwiId } }),
    ]);

    if (!session) return "SESSION_NOT_FOUND" as const;
    if (!hiwi) return "HIWI_NOT_FOUND" as const;

    return prisma.hiWiSession.upsert({
      where: { hiwiId_sessionId: { hiwiId, sessionId } },
      update: {},
      create: { hiwiId, sessionId },
    });
  },

  async unassignHiwi(sessionId: number, hiwiId: number) {
    const existing = await prisma.hiWiSession.findUnique({
      where: { hiwiId_sessionId: { hiwiId, sessionId } },
    });
    if (!existing) return false;

    await prisma.hiWiSession.delete({
      where: { hiwiId_sessionId: { hiwiId, sessionId } },
    });
    return true;
  },

  async getAttendance(sessionId: number) {
  return prisma.attendance.findMany({
    where: {
      sessionId,
    },
    include: {
      participant: {
        select: {
          id: true,
          name: true,
          email: true,
          qrId: true,
        },
      },
      scannedByHiwi: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      scannedAt: "asc",
    },
  });
  },

  async getSummary() {
    return prisma.session.findMany({
      select: {
        id: true,
        title: true,
        startsAt: true,
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
  },
};