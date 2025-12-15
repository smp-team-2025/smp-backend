import { Router } from "express";
import { sessionsController } from "./sessions.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

export const sessionsRouter = Router({ mergeParams: true });

// Organizer-only
sessionsRouter.get("/", requireAuth, requireRole("organizer"), sessionsController.list);
sessionsRouter.post("/", requireAuth, requireRole("organizer"), sessionsController.create);

sessionsRouter.get("/:sessionId", requireAuth, requireRole("organizer"), sessionsController.getById);
sessionsRouter.put("/:sessionId", requireAuth, requireRole("organizer"), sessionsController.update);
sessionsRouter.delete("/:sessionId", requireAuth, requireRole("organizer"), sessionsController.remove);