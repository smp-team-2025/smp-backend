import { Router } from "express";
import { eventsController } from "./events.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

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