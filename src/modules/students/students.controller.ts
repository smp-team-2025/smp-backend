import { Request, Response } from "express";
import { studentsService } from "./students.service";
import { toCsv } from "../../services/csv";


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

};

