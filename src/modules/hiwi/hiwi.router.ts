import { Router } from "express";
import { hiwiController } from "./hiwi.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

export const hiwiRouter = Router();

// organizer-only
hiwiRouter.use(requireAuth, requireRole(UserRole.ORGANIZER));

// CRUD
hiwiRouter.get("/", hiwiController.list);         // GET /api/hiwis
hiwiRouter.get("/:id", hiwiController.getById);   // GET /api/hiwis/:id  (id = hiwiId)
hiwiRouter.post("/", hiwiController.create);      // POST /api/hiwis
hiwiRouter.patch("/:id", hiwiController.update);  // PATCH /api/hiwis/:id
hiwiRouter.delete("/:id", hiwiController.remove); // DELETE /api/hiwis/:id