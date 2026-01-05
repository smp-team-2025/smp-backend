import { prisma } from "../../prisma";

type CreateInput = {
  title?: string;
  body: string;
  authorId: number;
  eventId?: number;
  sessionId?: number;
};

type UpdateAnnouncementInput = {
  title?: string | null;
  body?: string;
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

  async attachImage(params: {
    announcementId: number;
    file: Express.Multer.File;
  }) {
    const { announcementId, file } = params;

    const announcement = await prisma.staffAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }

    return prisma.announcementAttachment.create({
      data: {
        announcementId,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
      },
    });
  },

  async updateAnnouncement(id: number, data: UpdateAnnouncementInput) {
    return prisma.staffAnnouncement.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.body !== undefined && { body: data.body }),
      },
    });
  },

  async deleteAnnouncement(id: number) {
    await prisma.staffAnnouncement.delete({
      where: { id },
    });
  },
};