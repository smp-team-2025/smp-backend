import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";
import { announcementsController } from "./announcements.controller";
import { upload } from "../uploads/upload.middleware";

export const announcementsRouter = Router();

// Create (HIWI + ORGANIZER)
announcementsRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.HIWI),
  announcementsController.create
);

// List
announcementsRouter.get(
  "/",
  requireAuth,
  announcementsController.list
);

// Add Attachment
announcementsRouter.post(
  "/:id/attachments",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.HIWI),
  upload.single("file"),
  announcementsController.uploadAttachment
);

// Update Announcement
announcementsRouter.patch(
  "/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.HIWI),
  announcementsController.update
);

// Delete Announcement
announcementsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.HIWI),
  announcementsController.remove
);