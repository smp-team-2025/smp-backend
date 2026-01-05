import { Request, Response } from "express";
import { announcementsService } from "./announcements.service";

class AnnouncementsController {
  async create(req: Request, res: Response) {
    const auth = (req as any).auth;
    const { title, body, eventId, sessionId } = req.body;

    if (!body) {
      return res.status(400).json({ error: "BODY_REQUIRED" });
    }

    const announcement = await announcementsService.create({
      title,
      body,
      authorId: auth.userId,
      eventId,
      sessionId,
    });

    return res.status(201).json(announcement);
  }

  async list(req: Request, res: Response) {
    const { eventId, sessionId } = req.query;

    const announcements = await announcementsService.list({
      eventId: eventId ? Number(eventId) : undefined,
      sessionId: sessionId ? Number(sessionId) : undefined,
    });

    return res.json(announcements);
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
}

export const announcementsController = new AnnouncementsController();