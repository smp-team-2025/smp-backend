import { Request, Response } from "express";
import { studentsService } from "./students.service";
import { toCsv } from "../../services/csv";

function toRegistrationId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}


export const studentsController = {
  async list(req: Request, res: Response) {
    const raw = req.query.eventId;
    const eventId =
      typeof raw === "string" && raw.trim() !== "" ? Number(raw) : undefined;

    if (eventId !== undefined && Number.isNaN(eventId)) {
      return res.status(400).json({ error: "INVALID_EVENT_ID" });
    }

    const students = await studentsService.listApprovedStudents(eventId);
    res.json(students);
  },

async exportCsv(req: Request, res: Response) {
const raw = req.query.eventId;
const eventId =
  typeof raw === "string" && raw.trim() !== "" ? Number(raw) : undefined;

if (eventId !== undefined && Number.isNaN(eventId)) {
  return res.status(400).json({ error: "INVALID_EVENT_ID" });
}

const tag = eventId ? `event-${eventId}` : "active-event";

  const students = await studentsService.listApprovedStudents(eventId);

  const headers = [
  "Registrierungs-ID",
  "Benutzer-ID",
  "E-Mail",
  "Vorname",
  "Nachname",
  "Schule",
  "Jahrgang",
  "Ort",
  "PLZ",
  "Strasse und Hausnummer",
  "Adresszusatz",
  "Registriert am",
  "Status",
];

const rows = students.map((s: any) => ({
  "Registrierungs-ID": s.registrationId,
  "Benutzer-ID": s.userId,
  "E-Mail": s.email,
  "Vorname": s.firstName,
  "Nachname": s.lastName,
  "Schule": s.school,
  "Jahrgang": s.grade,
  "Ort": s.city,
  "PLZ": s.zipCode,
  "Strasse und Hausnummer": s.street,
  "Adresszusatz": s.addressExtra,
  "Registriert am": s.createdAt,
  "Status": s.status,
}));

const csv = toCsv(headers, rows);
res.setHeader("Content-Type", "text/csv; charset=utf-8");
res.setHeader(
  "Content-Disposition",
  `attachment; filename="participants_${tag}.csv"`
);

return res.status(200).send(csv);
},

  async update(req: Request, res: Response) {
    const registrationId = toRegistrationId(req.params.registrationId);
    if (registrationId === null) {
      return res.status(400).json({ error: "INVALID_ID" });
    }

    try {
      const updated = await studentsService.updateParticipant(registrationId, req.body ?? {});
      return res.json(updated);
    } catch (err: any) {
      if (err.message === "NOT_FOUND" || err.code === "P2025") {
        return res.status(404).json({ error: "NOT_FOUND" });
      }
      if (err.message === "EMPTY_FIELD") {
        return res.status(400).json({ error: "EMPTY_FIELD" });
      }
      if (err.message === "NO_FIELDS") {
        return res.status(400).json({ error: "NO_FIELDS" });
      }
      if (err.message === "EMAIL_ALREADY_REGISTERED" || err.code === "P2002") {
        return res.status(409).json({ error: "EMAIL_ALREADY_REGISTERED" });
      }

      console.error("Error updating participant:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async remove(req: Request, res: Response) {
    const registrationId = toRegistrationId(req.params.registrationId);
    if (registrationId === null) {
      return res.status(400).json({ error: "INVALID_ID" });
    }

    try {
      await studentsService.deleteParticipant(registrationId);
      return res.status(204).send();
    } catch (err: any) {
      if (err.message === "NOT_FOUND" || err.code === "P2025") {
        return res.status(404).json({ error: "NOT_FOUND" });
      }
      if (err.code === "P2003") {
        return res.status(409).json({ error: "PARTICIPANT_HAS_REFERENCES" });
      }

      console.error("Error deleting participant:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

};

