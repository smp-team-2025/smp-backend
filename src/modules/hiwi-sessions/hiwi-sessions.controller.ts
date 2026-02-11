import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { hiwiSessionsService } from "./hiwi-sessions.service";

const ALLOWED = ["AVAILABLE", "MAYBE", "UNAVAILABLE"] as const;
type HiwiStatus = typeof ALLOWED[number];

function isHiwiStatus(v: unknown): v is HiwiStatus {
    return typeof v === "string" && (ALLOWED as readonly string[]).includes(v);
}

export const hiwiSessionsController = {
    async updateStatus(req: AuthRequest, res: Response) {
        const auth = req.auth;
        if (!auth) return res.status(401).json({ error: "UNAUTHORIZED" });

        const hiwiSessionId = Number(req.params.id);
        if (Number.isNaN(hiwiSessionId)) {
            return res.status(400).json({ error: "INVALID_ID" });
        }

        const { status } = (req.body ?? {}) as { status?: unknown };

        if (!isHiwiStatus(status)) {
            return res.status(400).json({ error: "INVALID_STATUS" });
        }

        try {
            const updated = await hiwiSessionsService.updateMyStatus(
                auth.userId,
                hiwiSessionId,
                status
            );
            return res.json(updated);
        } catch (e: any) {
            const msg = e?.message ?? "INTERNAL_ERROR";
            if (msg === "HIWI_NOT_FOUND") return res.status(404).json({ error: msg });
            if (msg === "ASSIGNMENT_NOT_FOUND") return res.status(404).json({ error: msg });
            if (msg === "FORBIDDEN") return res.status(403).json({ error: msg });
            return res.status(500).json({ error: msg });
        }
    },
};