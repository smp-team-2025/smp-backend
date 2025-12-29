import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";
import { announcementsController } from "./announcements.controller";

export const announcementsRouter = Router();

// Create (HIWI + ORGANIZER)
announcementsRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.HIWI),
  announcementsController.create
);

// List (HIWI + ORGANIZER)
announcementsRouter.get(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.HIWI),
  announcementsController.list
);