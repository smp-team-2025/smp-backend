import { Router } from "express";
import { sessionsController } from "./sessions.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

export const sessionsRouter = Router({ mergeParams: true });

// Organizer-only
sessionsRouter.get("/", requireAuth, requireRole(UserRole.ORGANIZER), sessionsController.list);
sessionsRouter.post("/", requireAuth, requireRole(UserRole.ORGANIZER), sessionsController.create);

sessionsRouter.get("/:sessionId", requireAuth, requireRole(UserRole.ORGANIZER), sessionsController.getById);
sessionsRouter.put("/:sessionId", requireAuth, requireRole(UserRole.ORGANIZER), sessionsController.update);
sessionsRouter.delete("/:sessionId", requireAuth, requireRole(UserRole.ORGANIZER), sessionsController.remove);

//Hiwi Assignment (Organizer Only)
sessionsRouter.get(
  "/:sessionId/hiwis",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  sessionsController.listAssignedHiwis
);

sessionsRouter.post(
  "/:sessionId/hiwis",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  sessionsController.assignHiwi
);

sessionsRouter.delete(
  "/:sessionId/hiwis/:hiwiId",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  sessionsController.unassignHiwi
);