import { Request, Response } from "express";
import { announcementsService } from "./announcements.service";

class AnnouncementsController {
  async create(req: Request, res: Response) {
    const auth = (req as any).auth;
    const { title, body, eventId, sessionId, visibility } = req.body;

    if (!body) {
      return res.status(400).json({ error: "BODY_REQUIRED" });
    }

    const announcement = await announcementsService.create({
      title,
      body,
      eventId,
      sessionId,
      visibility,
      authorId: auth.userId,
    });

    return res.status(201).json(announcement);
  }

  async list(req: Request, res: Response) {
    const role = (req as any).auth.role;
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;

    const data = await announcementsService.list(
      { eventId, sessionId },
     role
    );

    res.json(data);
  }

  async uploadAttachment(req: Request, res: Response) {
    const announcementId = Number(req.params.id);
    const file = req.file;

    if (!file || !announcementId) {
      return res.status(400).json({ error: "FILE_AND_ID_REQUIRED" });
    }

    try {
      const attachment = await announcementsService.attachImage({
        announcementId,
        file,
      });

      return res.status(201).json(attachment);
    } catch (err: any) {
      return res.status(400).json({
        error: err.message ?? "UPLOAD_FAILED",
      });
    }
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const auth = (req as any).auth;

    if (!id) {
      return res.status(400).json({ error: "INVALID_ID" });
    }

    const {
      title,
      body,
      eventId,
      sessionId,
      visibility,
    } = req.body;

    const updated = await announcementsService.update(id, {
      title,
      body,
      eventId,
      sessionId,
      visibility,
    }, auth);

    return res.json(updated);
  }

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    const auth = (req as any).auth;

    if (!id) {
      return res.status(400).json({ error: "INVALID_ID" });
    }

    await announcementsService.deleteAnnouncement(id, auth);
    return res.status(204).send();
  }

  async listComments(req: Request, res: Response) {
    const announcementId = Number(req.params.id);
    const comments = await announcementsService.listComments(announcementId);
    res.json(comments);
  }

  async createComment(req: Request, res: Response) {
    const announcementId = Number(req.params.id);
    const { body } = req.body;
    const auth = (req as any).auth;

    if (!body) {
      return res.status(400).json({ error: "BODY_REQUIRED" });
    }

    const comment = await announcementsService.createComment({
      announcementId,
      body,
      authorId: auth.userId,
    });

    res.status(201).json(comment);
  }

  async updateComment(req: Request, res: Response) {
    const commentId = Number(req.params.commentId);
    const { body } = req.body;
    const auth = (req as any).auth;

    if (!body) {
      return res.status(400).json({ error: "BODY_REQUIRED" });
    }

    const updated = await announcementsService.updateComment(
      commentId,
      body,
      auth
    );

    res.json(updated);
  }

  async deleteComment(req: Request, res: Response) {
  const commentId = Number(req.params.commentId);
  const auth = (req as any).auth;

  await announcementsService.deleteComment(commentId, auth);

  return res.status(204).send();
}
}

export const announcementsController = new AnnouncementsController();