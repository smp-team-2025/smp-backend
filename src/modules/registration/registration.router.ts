import { Router } from "express";
import { registrationController } from "./registration.controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";


export const registrationRouter = Router();


// Organizer-Only
registrationRouter.get("/", requireAuth, requireRole(UserRole.ORGANIZER), registrationController.getAll);
registrationRouter.get("/:id", requireAuth, requireRole(UserRole.ORGANIZER), registrationController.getById);
registrationRouter.post("/:id/approve", requireAuth, requireRole(UserRole.ORGANIZER), registrationController.approve);
registrationRouter.post("/:id/reject", requireAuth, requireRole(UserRole.ORGANIZER), registrationController.reject);

// Public Registrations (students)
registrationRouter.post("/", registrationController.create);