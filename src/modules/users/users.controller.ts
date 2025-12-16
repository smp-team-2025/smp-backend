import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { UserRole } from "@prisma/client";
import { usersService } from "./users.service";

export const usersController = {
  async getQrCodePng(req: AuthRequest, res: Response) {
    const requestedId = Number(req.params.id);

    if (Number.isNaN(requestedId)) {
      return res.status(400).json({ error: "INVALID_USER_ID" });
    }

    if (!req.auth) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    if (req.auth.role === UserRole.PARTICIPANT && req.auth.userId !== requestedId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    try {
      const { png, fileName } = await usersService.getQrCodePngByUserId(requestedId);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      return res.status(200).send(png);
    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? "INTERNAL_ERROR" });
    }
  },
};