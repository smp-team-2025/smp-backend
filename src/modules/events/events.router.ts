import { Router } from "express";
import { eventsController } from "./events.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";
import { upload } from "../uploads/upload.middleware";

export const eventsRouter = Router();

// GET active event
eventsRouter.get("/active", requireAuth, eventsController.getActive);

// Organizer-only
eventsRouter.get("/", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.list);
eventsRouter.get("/:id", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.getById);
eventsRouter.post("/", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.create);
eventsRouter.put("/:id", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.update);
eventsRouter.delete("/:id", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.remove);
eventsRouter.patch("/:id", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.patchEvent);
eventsRouter.patch("/:id/diploma-settings",requireAuth,requireRole(UserRole.ORGANIZER),eventsController.updateDiplomaSettings);
eventsRouter.post("/:id/diploma-signatures",requireAuth,requireRole(UserRole.ORGANIZER),upload.fields([{ name: "signer1Signature", maxCount: 1 },{ name: "signer2Signature", maxCount: 1 },]),eventsController.uploadDiplomaSignatures);
eventsRouter.get("/:id/hiwi-attendance", requireAuth, requireRole(UserRole.ORGANIZER), eventsController.getHiwiAttendanceByEvent);
