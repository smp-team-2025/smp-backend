import { Router } from "express";
import { studentsController } from "./students.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

export const studentsRouter = Router();

studentsRouter.get(
  "/",
  requireAuth,
  requireRole("organizer"),
  studentsController.list
);