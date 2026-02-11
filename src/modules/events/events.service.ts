import { prisma } from "../../prisma";

type CreateEventInput = {
  title: string;
  description?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  isActive?: boolean | null;
};

type UpdateEventInput = Partial<CreateEventInput>;

function parseDate(value: any): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

export const eventsService = {
  async getActive() {
    return prisma.event.findFirst({
      where: { isActive: true },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true, title: true, description: true, startDate: true,
        endDate: true, isActive: true, registrationClosesAt: true
      }
    });
  },

  async updateRegistrationClosesAt(eventId: number, value: string | null) {
    let next: Date | null = null;

    if (value !== null) {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        const err: any = new Error("INVALID_DATE");
        err.code = "INVALID_DATE";
        throw err;
      }
      next = d;
    }

    const exists = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!exists) {
      const err: any = new Error("EVENT_NOT_FOUND");
      err.code = "EVENT_NOT_FOUND";
      throw err;
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { registrationClosesAt: next },
      select: {
        id: true,
        title: true,
        registrationClosesAt: true,
      },
    });

    return updated;
  },

  async list() {
    return prisma.event.findMany({
      orderBy: [
        { isActive: "desc" }, //active on the top
        { createdAt: "desc" },
      ],
    });
  },

  async getById(id: number) {
    return prisma.event.findUnique({ where: { id } });
  },

  async create(input: CreateEventInput) {
    const startDate = parseDate(input.startDate);
    const endDate = parseDate(input.endDate);

    // default false
    const wantActive = input.isActive === true;

    return prisma.$transaction(async (tx) => {
      if (wantActive) {
        await tx.event.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.event.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          startDate: startDate ?? null,
          endDate: endDate ?? null,
          isActive: wantActive ? true : false,
        },
      });
    });
  },

  async update(id: number, input: UpdateEventInput) {
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!existing) return null;

    const startDate = parseDate(input.startDate);
    const endDate = parseDate(input.endDate);

    const isActiveProvided = input.isActive !== undefined;
    const wantActive = input.isActive === true;

    return prisma.$transaction(async (tx) => {
      //If a new event is activated, the others are deactivated
      if (isActiveProvided && wantActive) {
        await tx.event.updateMany({
          where: { id: { not: id }, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.event.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title as any } : {}),
          ...(input.description !== undefined ? { description: input.description ?? null } : {}),
          ...(startDate !== undefined ? { startDate } : {}),
          ...(endDate !== undefined ? { endDate } : {}),
          ...(isActiveProvided ? { isActive: !!input.isActive } : {}),
        },
      });
    });
  },

  async remove(id: number) {
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!existing) return false;

    if (existing.isActive) {
      throw new Error("CANNOT_DELETE_ACTIVE_EVENT");
    }

    await prisma.event.delete({ where: { id } });
    return true;
  },

  async getActiveEventId(): Promise<number> {
    const active = await prisma.event.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: [{ createdAt: "desc" }],
    });
    if (!active) throw new Error("NO_ACTIVE_EVENT");
    return active.id;
  },

  async getHiwiAttendanceByEvent(eventId: number) {
    // sessions of this event
    const sessions = await prisma.session.findMany({
      where: { eventId },
      select: { id: true, title: true, startsAt: true, location: true },
      orderBy: { startsAt: "asc" },
    });

    // all hiwi assignments for sessions of this event
    const assignments = await prisma.hiWiSession.findMany({
      where: { session: { eventId } },
      select: {
        status: true, // must exist
        sessionId: true,
        hiwi: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { sessionId: "asc" },
    });

    const bySessionId = new Map<number, any[]>();
    for (const a of assignments) {
      if (!bySessionId.has(a.sessionId)) bySessionId.set(a.sessionId, []);
      bySessionId.get(a.sessionId)!.push({
        hiwiId: a.hiwi.id,
        userId: a.hiwi.user.id,
        name: a.hiwi.user.name,
        email: a.hiwi.user.email,
        status: a.status ?? null,
      });
    }

    return sessions.map((s) => ({
      session: s,
      hiwis: bySessionId.get(s.id) ?? [],
    }));
  },
};