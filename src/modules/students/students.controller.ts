import { Request, Response } from "express";
import { studentsService } from "./students.service";

export const studentsController = {
  async list(req: Request, res: Response) {
    const raw = req.query.eventId;
    const eventId =
      typeof raw === "string" && raw.trim() !== "" ? Number(raw) : undefined;

    if (eventId !== undefined && Number.isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    const students = await studentsService.listApprovedStudents(eventId);
    res.json(students);
  },
};