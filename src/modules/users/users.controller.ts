import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { UserRole } from "@prisma/client";
import { usersService } from "./users.service";

export const usersController = {

  async me(req: any, res: Response) {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: "UNAUTHORIZED" });

      const me = await usersService.getMe(auth.userId);
      return res.json(me); // { id, name, email, role }
    },

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

  async getBusinessCardPdf(req: AuthRequest, res: Response) {
    const requestedId = Number(req.params.id);
    if (Number.isNaN(requestedId)) {
      return res.status(400).json({ error: "INVALID_USER_ID" });
    }

    const auth = (req as any).auth;
    if (!auth) return res.status(401).json({ error: "UNAUTHORIZED" });

    // PARTICIPANT can access only its own pdf
    if (auth.role === UserRole.PARTICIPANT && auth.userId !== requestedId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    // HIWI cant access pdf
    if (auth.role === UserRole.HIWI) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    // ORGANIZER can access all pdfs
    const { pdf, fileName } =
      await usersService.generateBusinessCardPdf(requestedId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.status(200).send(pdf);
  },
};