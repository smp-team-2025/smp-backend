import { Router } from "express";
import { registrationController } from "./registration.controller";

export const registrationRouter = Router();

// POST /api/registrations
registrationRouter.post("/", registrationController.create);