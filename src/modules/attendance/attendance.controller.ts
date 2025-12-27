import { Request, Response } from "express";
import { attendanceService } from "./attendance.service";

class AttendanceController {
  async scan(req: Request, res: Response) {
    const { qrId, sessionId } = req.body;

    if (!qrId || !sessionId) {
      return res.status(400).json({
        error: "qrId and sessionId are required",
      });
    }

    const auth = (req as any).auth;
    const hiwiUserId = auth.userId;

    try {
      const attendance = await attendanceService.scan({
        qrId,
        sessionId: Number(sessionId),
        hiwiUserId,
      });

      return res.status(201).json(attendance);
    } catch (err: any) {
      return res.status(400).json({
        error: err.message ?? "ATTENDANCE_SCAN_FAILED",
      });
    }
  }

  async manual(req: Request, res: Response) {
    const { participantId, sessionId } = req.body;

    if (!participantId || !sessionId) {
      return res.status(400).json({
        error: "participantId and sessionId are required",
      });
    }

    try {
      const attendance = await attendanceService.manual({
        participantId: Number(participantId),
        sessionId: Number(sessionId),
      });

      return res.status(201).json(attendance);
    } catch (err: any) {
      return res.status(400).json({
        error: err.message ?? "ATTENDANCE_MANUAL_FAILED",
      });
    }
  }

  async remove(req: Request, res: Response) {
    const attendanceId = Number(req.params.attendanceId);

    if (Number.isNaN(attendanceId)) {
      return res.status(400).json({ error: "INVALID_ATTENDANCE_ID" });
    }

    const deleted = await attendanceService.remove(attendanceId);

    if (!deleted) {
      return res.status(404).json({ error: "ATTENDANCE_NOT_FOUND" });
    }

    return res.json({ success: true });
  }
}

export const attendanceController = new AttendanceController();