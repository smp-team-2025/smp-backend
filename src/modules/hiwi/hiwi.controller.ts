import { Request, Response } from "express";
import { hiwiService } from "./hiwi.service";

export const hiwiController = {
  async list(_req: Request, res: Response) {
    const data = await hiwiService.list();
    res.json(data);
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "INVALID_ID" });

    const hiwi = await hiwiService.getById(id);
    if (!hiwi) return res.status(404).json({ error: "NOT_FOUND" });

    res.json(hiwi);
  },

  async create(req: Request, res: Response) {
    const { email, name, clothingSize } = req.body ?? {};
    if (!email || typeof email !== "string") return res.status(400).json({ error: "EMAIL_REQUIRED" });
    if (!name || typeof name !== "string") return res.status(400).json({ error: "NAME_REQUIRED" });
    if (clothingSize != null && typeof clothingSize !== "string") return res.status(400).json({ error: "INVALID_CLOTHING_SIZE" });

    const result = await hiwiService.create({ email, name, clothingSize });
    res.status(201).json(result);
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "INVALID_ID" });

    const { name, clothingSize } = req.body ?? {};
    if (name != null && typeof name !== "string") return res.status(400).json({ error: "INVALID_NAME" });
    if (clothingSize != null && typeof clothingSize !== "string") return res.status(400).json({ error: "INVALID_CLOTHING_SIZE" });

    const updated = await hiwiService.update(id, { name, clothingSize });
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });

    res.json(updated);
  },

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "INVALID_ID" });

    const ok = await hiwiService.remove(id);
    if (!ok) return res.status(404).json({ error: "NOT_FOUND" });

    res.status(204).send();
  },

  async getMySessions(req: Request, res: Response) {
    try {
      const auth = (req as any).auth;
      const userId = auth.userId;

      const sessions = await hiwiService.getMySessions(userId);

      return res.json(sessions);
    } catch (err: any) {
      return res.status(400).json({
        error: err.message ?? "FAILED_TO_GET_HIWI_SESSIONS",
      });
    }
  },
};