import { Router } from "express";
import { eventsController } from "./events.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

export const eventsRouter = Router();

// Organizer-only
eventsRouter.get("/", requireAuth, requireRole("organizer"), eventsController.list);
eventsRouter.get("/:id", requireAuth, requireRole("organizer"), eventsController.getById);
eventsRouter.post("/", requireAuth, requireRole("organizer"), eventsController.create);
eventsRouter.put("/:id", requireAuth, requireRole("organizer"), eventsController.update);
eventsRouter.delete("/:id", requireAuth, requireRole("organizer"), eventsController.remove);