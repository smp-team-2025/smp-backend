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
      select: { id: true, title: true, description: true, startDate: true, endDate: true, isActive: true }
    });
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
};