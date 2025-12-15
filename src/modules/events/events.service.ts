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
  if (value === undefined) return undefined; // means "do not touch"
  if (value === null) return null; // means "set null"
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined; // invalid -> ignore
  return d;
}

export const eventsService = {
  async list() {
    return prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: number) {
    return prisma.event.findUnique({
      where: { id },
    });
  },

  async create(input: CreateEventInput) {
    return prisma.event.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        startDate: parseDate(input.startDate) ?? null,
        endDate: parseDate(input.endDate) ?? null,
        isActive: input.isActive ?? true,
      },
    });
  },

  async update(id: number, input: UpdateEventInput) {
    const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;

    const startDate = parseDate(input.startDate);
    const endDate = parseDate(input.endDate);

    return prisma.event.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title as any } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        ...(input.isActive !== undefined ? { isActive: !!input.isActive } : {}),
      },
    });
  },

  async remove(id: number) {
    const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return false;

    await prisma.event.delete({ where: { id } });
    return true;
  },
};