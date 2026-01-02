import { Request, Response } from "express";
import { attendanceService } from "./attendance.service";

class AttendanceController {
    //QR attendance taking by HiWi
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

    //Manual Attendance taking by Organizers
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

    //Removing attendance by Organizers
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

  //Participants can get their own attendance
  async getMyAttendance(req: Request, res: Response) {
    const auth = (req as any).auth;

    const data = await attendanceService.getMyAttendance(auth.userId);

    return res.json(
      data.map((a) => ({
        sessionId: a.session.id,
        sessionTitle: a.session.title,
        startsAt: a.session.startsAt,
        endsAt: a.session.endsAt,
        location: a.session.location,
        eventTitle: a.session.event.title,
        scannedAt: a.scannedAt,
      }))
    );
  }

  //Organizers upload zoom attendance as csv
  async uploadZoomCsv(req: Request, res: Response) {
    const sessionId = Number(req.body.sessionId);
    const file = req.file;

    if (!sessionId || !file) {
      return res.status(400).json({
        error: "sessionId and CSV file are required",
      });
    }

    const rows = await parseZoomCsv(file.path);

    const result = await attendanceService.importZoomCsv({
      sessionId,
      rows,
    });

    return res.json(result);
  }

  async getZoomUnmatched(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId);

    const data = await attendanceService.getZoomUnmatched(sessionId);
    return res.json(data);
  }
}

export const attendanceController = new AttendanceController();