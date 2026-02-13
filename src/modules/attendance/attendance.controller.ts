import { Request, Response } from "express";
import { attendanceService } from "./attendance.service";
import { parseZoomCsv } from "../../services/zoomCsv";
import { toCsv } from "../../services/csv";

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

  // Export attendance as CSV (Organizer only)
async exportCsv(req: Request, res: Response) {
  const rawSessionId = req.query.sessionId;
  const rawEventId = req.query.eventId;

  const sessionId =
    typeof rawSessionId === "string" && rawSessionId.trim() !== ""
      ? Number(rawSessionId)
      : undefined;
  const eventId =
    typeof rawEventId === "string" && rawEventId.trim() !== ""
      ? Number(rawEventId)
      : undefined;

  if (sessionId !== undefined && Number.isNaN(sessionId)) {
    return res.status(400).json({ error: "INVALID_SESSION_ID" });
  }
  if (eventId !== undefined && Number.isNaN(eventId)) {
    return res.status(400).json({ error: "INVALID_EVENT_ID" });
  }

  if (!sessionId && !eventId) {
    return res.status(400).json({
      error: "sessionId or eventId query parameter is required",
    });
  }

  try {
    const data = sessionId
      ? await attendanceService.listAttendancesForSession(sessionId)
      : await attendanceService.listAttendancesForEvent(eventId!);

    const attendances = data.attendances;

    const headers = [
      "eventId",
      "eventTitle",
      "sessionId",
      "sessionTitle",
      "sessionStartsAt",
      "attendanceId",
      "participantId",
      "participantName",
      "participantEmail",
      "participantSchool",
      "participantGrade",
      "scannedAt",
      "source",
      "scannedByHiwiName",
      "scannedByHiwiEmail",
    ];

    const rows = (data as any).attendances.map((a: any) => ({
      eventId: a.session.event.id,
      eventTitle: a.session.event.title,
      sessionId: a.session.id,
      sessionTitle: a.session.title,
      sessionStartsAt: a.session.startsAt,
      attendanceId: a.id,
      participantId: a.participant.id,
      participantName: a.participant.name,
      participantEmail: a.participant.email,
      participantSchool: a.participant.registration?.school ?? "",
      participantGrade: a.participant.registration?.grade ?? "",
      scannedAt: a.scannedAt,
      source: a.source,
      scannedByHiwiName: a.scannedByHiwi?.user?.name ?? "",
      scannedByHiwiEmail: a.scannedByHiwi?.user?.email ?? "",
    }));

    const csv = toCsv(headers, rows);

    const fileTag = sessionId ? `session-${sessionId}` : `event-${eventId}`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${fileTag}.csv"`
    );
    return res.status(200).send(csv);
  } catch (err: any) {
    if (err.message === "SESSION_NOT_FOUND") {
      return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    }
    if (err.message === "EVENT_NOT_FOUND") {
      return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    }
    console.error("Export attendance CSV error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}
}

export const attendanceController = new AttendanceController();