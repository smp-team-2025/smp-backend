import { Router } from "express";
import { attendanceController } from "./attendance.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

export const attendanceRouter = Router();

// POST /api/attendance/scan
attendanceRouter.post(
  "/scan",
  requireAuth,
  requireRole(UserRole.HIWI),
  attendanceController.scan
);

// POST /api/attendance/manual
attendanceRouter.post(
  "/manual",
  requireAuth,
  requireRole(UserRole.ORGANIZER), //Organizer only
  attendanceController.manual
);

// DELETE /api/attendance/:attendanceId (Organizer only)
attendanceRouter.delete(
  "/:attendanceId", //Delete by Attendance ID
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  attendanceController.remove
);

// GET /api/attendance/me (Participant only)
attendanceRouter.get(
  "/me",
  requireAuth,
  requireRole(UserRole.PARTICIPANT),
  attendanceController.getMyAttendance
);