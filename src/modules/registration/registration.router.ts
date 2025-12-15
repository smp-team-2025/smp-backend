import { Router } from "express";
import { registrationController } from "./registration.controller";
import { requireAuth, requireRole } from "../../middleware/auth";


export const registrationRouter = Router();


// Organizer-Only
registrationRouter.get("/", requireAuth, requireRole("organizer"), registrationController.getAll);
registrationRouter.get("/:id", requireAuth, requireRole("organizer"), registrationController.getById);
registrationRouter.post("/:id/approve", requireAuth, requireRole("organizer"), registrationController.approve);
registrationRouter.post("/:id/reject", requireAuth, requireRole("organizer"), registrationController.reject);

// Public Registrations (students)
registrationRouter.post("/", registrationController.create);