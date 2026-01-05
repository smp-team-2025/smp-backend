import { AnnouncementVisibility, UserRole } from "@prisma/client";
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
  visibility?: AnnouncementVisibility;

};

export const announcementsService = {
  async create(data: {
    title?: string;
    body: string;
    eventId?: number;
    sessionId?: number;
    visibility?: AnnouncementVisibility;
    authorId: number;
  }) {
    return prisma.staffAnnouncement.create({
      data: {
        title: data.title,
        body: data.body,
        eventId: data.eventId,
        sessionId: data.sessionId,
        authorId: data.authorId,
        visibility: data.visibility ?? AnnouncementVisibility.HIWI_ORGA, 
      },
    });
  },

  async list(
    filter: { eventId?: number; sessionId?: number },
    role: UserRole
  ) {
    const visibilityFilter =
      role === UserRole.ORGANIZER
        ? {}
        : role === UserRole.HIWI
        ? { visibility: { in: [AnnouncementVisibility.HIWI_ORGA, AnnouncementVisibility.PUBLIC] } }
        : { visibility: AnnouncementVisibility.PUBLIC };

    return prisma.staffAnnouncement.findMany({
      where: {
        ...visibilityFilter,
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

  async update(
    id: number,
    data: {
      title?: string;
      body?: string;
      eventId?: number;
      sessionId?: number;
      visibility?: AnnouncementVisibility;
    },
    auth: { userId: number; role: UserRole }
  ) {
    const announcement = await prisma.staffAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }

    // Organizer can edit anything
    if (
      auth.role !== UserRole.ORGANIZER &&
      announcement.authorId !== auth.userId
    ) {
    throw new Error("FORBIDDEN");
    }

    return prisma.staffAnnouncement.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        eventId: data.eventId,
        sessionId: data.sessionId,
        ...(data.visibility !== undefined && { visibility: data.visibility }),
      },
    });
  },

  async deleteAnnouncement(
    id: number,
    auth: { userId: number; role: UserRole }
  ) {
    const announcement = await prisma.staffAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new Error("ANNOUNCEMENT_NOT_FOUND");
    }

    if (
      auth.role !== UserRole.ORGANIZER &&
      announcement.authorId !== auth.userId
    ) {
      throw new Error("FORBIDDEN");
    }

    await prisma.staffAnnouncement.delete({ where: { id } });
  },

  async listComments(announcementId: number) {
    return prisma.announcementComment.findMany({
      where: { announcementId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  },

  async createComment(data: {
    announcementId: number;
    body: string;
    authorId: number;
  }) {
    return prisma.announcementComment.create({
      data,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  },

  async updateComment(
    commentId: number,
    body: string,
    auth: { userId: number; role: UserRole }
  ) {
    const comment = await prisma.announcementComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    if (
      auth.role !== UserRole.ORGANIZER &&
      comment.authorId !== auth.userId
    ) {
      throw new Error("FORBIDDEN");
    }

    return prisma.announcementComment.update({
      where: { id: commentId },
      data: { body },
    });
  },

  async deleteComment(
    commentId: number,
    auth: { userId: number; role: UserRole }
  ) {
    const comment = await prisma.announcementComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    // Organizer can delete anything
    if (
      auth.role !== UserRole.ORGANIZER &&
      comment.authorId !== auth.userId
    ) {
      throw new Error("FORBIDDEN");
    }

    await prisma.announcementComment.delete({
      where: { id: commentId },
    });
  }
};