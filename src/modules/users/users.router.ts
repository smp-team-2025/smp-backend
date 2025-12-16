import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { usersController } from "./users.controller";

export const usersRouter = Router();

// GET /api/users/:id/qrcode
usersRouter.get("/:id/qrcode", requireAuth, usersController.getQrCodePng);

// GET /api/users/:id/business-card.pdf
usersRouter.get(
  "/:id/business-card.pdf",
  requireAuth,
  usersController.getBusinessCardPdf
);