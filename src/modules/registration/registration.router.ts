import { Router } from "express";
import { registrationController } from "./registration.controller";

export const registrationRouter = Router();

// GET /api/registrations - Issue #32
registrationRouter.get("/", registrationController.getAll);

// GET /api/registrations/:id - Issue #33
registrationRouter.get("/:id", registrationController.getById);

// POST /api/registrations/:id/approve - Issue #34
registrationRouter.post("/:id/approve", registrationController.approve);

// POST /api/registrations/:id/reject - Issue #35
registrationRouter.post("/:id/reject", registrationController.reject);

// POST /api/registrations
registrationRouter.post("/", registrationController.create);