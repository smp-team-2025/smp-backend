import { Router } from "express";
import { studentsController } from "./students.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

export const studentsRouter = Router();

studentsRouter.get(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  studentsController.list
);