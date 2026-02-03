import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { usersController } from "./users.controller";

export const usersRouter = Router();

//GET /api/me
usersRouter.get("/me", requireAuth, usersController.me);

// GET /api/users/:id/qrcode
usersRouter.get("/:id/qrcode", requireAuth, usersController.getQrCodePng);

// GET /api/users/:id/business-card.pdf
usersRouter.get(
  "/:id/business-card.pdf",
  requireAuth,
  usersController.getBusinessCardPdf
);

// GET /api/details
usersRouter.get("/details", requireAuth, usersController.details);
// PATCH /api/details
usersRouter.patch("/details", requireAuth, usersController.update);