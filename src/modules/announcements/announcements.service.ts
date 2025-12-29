import { prisma } from "../../prisma";

type CreateInput = {
  title?: string;
  body: string;
  authorId: number;
  eventId?: number;
  sessionId?: number;
};

export const announcementsService = {
  async create(input: CreateInput) {
    if (!input.eventId && !input.sessionId) {
      throw new Error("EVENT_OR_SESSION_REQUIRED");
    }

    return prisma.staffAnnouncement.create({
      data: {
        title: input.title,
        body: input.body,
        authorId: input.authorId,
        eventId: input.eventId,
        sessionId: input.sessionId,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });
  },

  async list(filter: { eventId?: number; sessionId?: number }) {
    return prisma.staffAnnouncement.findMany({
      where: {
        ...(filter.eventId ? { eventId: filter.eventId } : {}),
        ...(filter.sessionId ? { sessionId: filter.sessionId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });
  },
};