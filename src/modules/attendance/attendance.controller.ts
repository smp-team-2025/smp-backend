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
}

export const attendanceController = new AttendanceController();