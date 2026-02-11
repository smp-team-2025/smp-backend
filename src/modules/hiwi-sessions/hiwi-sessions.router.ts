import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";
import { hiwiSessionsController } from "./hiwi-sessions.controller";

export const hiwiSessionsRouter = Router();

// HIWI updates own availability on an assigned hiwiSession
hiwiSessionsRouter.patch(
    "/:id",
    requireAuth,
    requireRole(UserRole.HIWI),
    hiwiSessionsController.updateStatus
);