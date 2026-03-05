import { Request, Response } from "express";
import { eventsService } from "./events.service";

function toIntId(param: string) {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export const eventsController = {
  async getHiwiAttendanceByEvent(req: Request, res: Response) {
    const eventId = Number(req.params.id);
    if (Number.isNaN(eventId)) return res.status(400).json({ error: "INVALID_EVENT_ID" });

    try {
      const data = await eventsService.getHiwiAttendanceByEvent(eventId);
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message ?? "INTERNAL_ERROR" });
    }
  },

  async getActive(_req: Request, res: Response) {
    const active = await eventsService.getActive();
    if (!active) return res.status(404).json({ error: "NO_ACTIVE_EVENT" });
    return res.json(active);
  },

  async patchEvent(req: Request, res: Response) {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    const { registrationClosesAt } = req.body ?? {};

    if (!(registrationClosesAt === null || typeof registrationClosesAt === "string")) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    try {
      const updated = await eventsService.updateRegistrationClosesAt(
        eventId,
        registrationClosesAt
      );
      return res.json(updated);
    } catch (e: any) {
      if (e?.code === "INVALID_DATE") return res.status(400).json({ error: "INVALID_DATE" });
      if (e?.code === "EVENT_NOT_FOUND") return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      console.error(e);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  },

  async list(_req: Request, res: Response) {
    const events = await eventsService.list();
    res.json(events);
  },

  async getById(req: Request, res: Response) {
    const id = toIntId(req.params.id);
    if (!id) return res.status(400).json({ error: "INVALID_ID" });

    const event = await eventsService.getById(id);
    if (!event) return res.status(404).json({ error: "NOT_FOUND" });

    res.json(event);
  },

  async create(req: Request, res: Response) {
    const { title, description, startDate, endDate, isActive } = req.body ?? {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "TITLE_REQUIRED" });
    }

    if (startDate && endDate && String(startDate) > String(endDate)) {
      return res.status(400).json({ error: "INVALID_DATE_RANGE" });
    }

    const created = await eventsService.create({
      title,
      description,
      startDate,
      endDate,
      isActive,
    });

    res.status(201).json(created);
  },

  async update(req: Request, res: Response) {
    const id = toIntId(req.params.id);
    if (!id) return res.status(400).json({ error: "INVALID_ID" });

    const { title, description, startDate, endDate, isActive } = req.body ?? {};

    if (startDate && endDate && String(startDate) > String(endDate)) {
      return res.status(400).json({ error: "INVALID_DATE_RANGE" });
    }

    const updated = await eventsService.update(id, {
      title,
      description,
      startDate,
      endDate,
      isActive,
    });

    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });

    res.json(updated);
  },

    async updateDiplomaSettings(req: Request, res: Response) {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    const body = (req.body ?? {}) as any;

    const {
      diplomaSigner1Name,
      diplomaSigner1Role,
      diplomaSigner2Name,
      diplomaSigner2Role,
      diplomaLocation,
    } = body;

    const isStrOrNull = (v: any) =>
      v === null || typeof v === "string" || typeof v === "undefined";

    if (
      !isStrOrNull(diplomaSigner1Name) ||
      !isStrOrNull(diplomaSigner1Role) ||
      !isStrOrNull(diplomaSigner2Name) ||
      !isStrOrNull(diplomaSigner2Role) ||
      !isStrOrNull(diplomaLocation)
    ) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    try {
      const updated = await eventsService.updateDiplomaSettings(eventId, {
        diplomaSigner1Name: diplomaSigner1Name ?? null,
        diplomaSigner1Role: diplomaSigner1Role ?? null,
        diplomaSigner2Name: diplomaSigner2Name ?? null,
        diplomaSigner2Role: diplomaSigner2Role ?? null,
        diplomaLocation: diplomaLocation ?? null,
      });
      return res.json(updated);
    } catch (e: any) {
      if (e?.code === "EVENT_NOT_FOUND") {
        return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      }
      console.error(e);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  },

    async uploadDiplomaSignatures(req: Request, res: Response) {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
    const signer1 = files["signer1Signature"]?.[0];
    const signer2 = files["signer2Signature"]?.[0];

    if (!signer1 && !signer2) {
      return res.status(400).json({ error: "NO_FILES_UPLOADED" });
    }

    try {
      const updated = await eventsService.updateDiplomaSignatureUrls(eventId, {
        signer1Url: signer1 ? `/uploads/diploma-signatures/${signer1.filename}` : undefined,
        signer2Url: signer2 ? `/uploads/diploma-signatures/${signer2.filename}` : undefined,
      });
      return res.json(updated);
    } catch (e: any) {
      if (e?.code === "EVENT_NOT_FOUND") {
        return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      }
      console.error(e);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  },

  async remove(req: Request, res: Response) {
    const id = toIntId(req.params.id);
    if (!id) return res.status(400).json({ error: "INVALID_ID" });

    try {
      const ok = await eventsService.remove(id);
      if (!ok) return res.status(404).json({ error: "NOT_FOUND" });
      return res.status(204).send();
    } catch (err: any) {
      if (err?.message === "CANNOT_DELETE_ACTIVE_EVENT") {
        return res.status(409).json({ error: "CANNOT_DELETE_ACTIVE_EVENT" });
      }
      console.error(err);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async updateApprovalEmailSettings(req: Request, res: Response) {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    const body = (req.body ?? {}) as any;
    const { approvalEmailSubject, approvalEmailIntro } = body;

    const isStrOrNullOrUndef = (v: any) =>
      v === null || typeof v === "string" || typeof v === "undefined";

    if (
      !isStrOrNullOrUndef(approvalEmailSubject) ||
      !isStrOrNullOrUndef(approvalEmailIntro)
    ) {
      return res.status(400).json({ error: "INVALID_BODY" });
    }

    try {
      const updated = await eventsService.updateApprovalEmailSettings(eventId, {
        approvalEmailSubject: approvalEmailSubject ?? null,
        approvalEmailIntro: approvalEmailIntro ?? null,
      });
      return res.json(updated);
    } catch (e: any) {
      if (e?.code === "EVENT_NOT_FOUND") {
        return res.status(404).json({ error: "EVENT_NOT_FOUND" });
      }
      console.error(e);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  },
};