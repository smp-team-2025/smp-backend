import { Request, Response } from "express";
import { sessionsService } from "./sessions.service";

function toIntId(param: string) {
  const n = Number(param);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export const sessionsController = {
  // GET /api/events/:id/sessions
  async list(req: Request, res: Response) {
    const eventId = toIntId(req.params.id);
    if (!eventId) return res.status(400).json({ error: "INVALID_EVENT_ID" });

    const sessions = await sessionsService.list(eventId);
    res.json(sessions);
  },

  // GET /api/events/:id/sessions/:sessionId
  async getById(req: Request, res: Response) {
    const eventId = toIntId(req.params.id);
    const sessionId = toIntId(req.params.sessionId);
    if (!eventId) return res.status(400).json({ error: "INVALID_EVENT_ID" });
    if (!sessionId) return res.status(400).json({ error: "INVALID_SESSION_ID" });

    const session = await sessionsService.getById(eventId, sessionId);
    if (!session) return res.status(404).json({ error: "NOT_FOUND" });

    res.json(session);
  },

  // POST /api/events/:id/sessions
  async create(req: Request, res: Response) {
    const eventId = toIntId(req.params.id);
    if (!eventId) return res.status(400).json({ error: "INVALID_EVENT_ID" });

    const { title, description, location, startsAt, endsAt } = req.body ?? {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "TITLE_REQUIRED" });
    }
    if (startsAt === undefined || startsAt === null) {
      return res.status(400).json({ error: "STARTS_AT_REQUIRED" });
    }

    try {
      const created = await sessionsService.create(eventId, {
        title,
        description,
        location,
        startsAt,
        endsAt,
      });

      if (!created) return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      res.status(201).json(created);
    } catch (e: any) {
      return res.status(400).json({ error: e?.message ?? "BAD_REQUEST" });
    }
  },

  // PUT /api/events/:id/sessions/:sessionId
  async update(req: Request, res: Response) {
    const eventId = toIntId(req.params.id);
    const sessionId = toIntId(req.params.sessionId);
    if (!eventId) return res.status(400).json({ error: "INVALID_EVENT_ID" });
    if (!sessionId) return res.status(400).json({ error: "INVALID_SESSION_ID" });

    const { title, description, location, startsAt, endsAt } = req.body ?? {};

    
    if (startsAt === null) {
      return res.status(400).json({ error: "STARTS_AT_CANNOT_BE_NULL" });
    }

    try {
      const updated = await sessionsService.update(eventId, sessionId, {
        title,
        description,
        location,
        startsAt,
        endsAt,
      });

      if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
      res.json(updated);
    } catch (e: any) {
      return res.status(400).json({ error: e?.message ?? "BAD_REQUEST" });
    }
  },

  // DELETE /api/events/:id/sessions/:sessionId
  async remove(req: Request, res: Response) {
    const eventId = toIntId(req.params.id);
    const sessionId = toIntId(req.params.sessionId);
    if (!eventId) return res.status(400).json({ error: "INVALID_EVENT_ID" });
    if (!sessionId) return res.status(400).json({ error: "INVALID_SESSION_ID" });

    const ok = await sessionsService.remove(eventId, sessionId);
    if (!ok) return res.status(404).json({ error: "NOT_FOUND" });

    res.status(204).send();
  },

  async listAssignedHiwis(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId);
    if (Number.isNaN(sessionId)) return res.status(400).json({ error: "INVALID_SESSION_ID" });

    const data = await sessionsService.listAssignedHiwis(sessionId);
    if (!data) return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    return res.json(data);
  },

  async assignHiwi(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId);
    if (Number.isNaN(sessionId)) return res.status(400).json({ error: "INVALID_SESSION_ID" });

    const { hiwiId } = req.body ?? {};
    const hiwiIdNum = Number(hiwiId);
    if (Number.isNaN(hiwiIdNum)) return res.status(400).json({ error: "INVALID_HIWI_ID" });

    const result = await sessionsService.assignHiwi(sessionId, hiwiIdNum);
    if (result === "SESSION_NOT_FOUND") return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    if (result === "HIWI_NOT_FOUND") return res.status(404).json({ error: "HIWI_NOT_FOUND" });

    return res.status(201).json(result);
  },

  async unassignHiwi(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId);
    const hiwiId = Number(req.params.hiwiId);
    if (Number.isNaN(sessionId) || Number.isNaN(hiwiId)) return res.status(400).json({ error: "INVALID_ID" });

    const ok = await sessionsService.unassignHiwi(sessionId, hiwiId);
    if (!ok) return res.status(404).json({ error: "ASSIGNMENT_NOT_FOUND" });

    return res.status(204).send();
  },

  async getAttendance(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "INVALID_SESSION_ID" });
    }

    const attendance = await sessionsService.getAttendance(sessionId);

    return res.json(attendance);
  },
};