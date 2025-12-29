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
}

export const announcementsController = new AnnouncementsController();