import { Request, response, Response } from "express";
import { registrationService } from "./registration.service";

function toOptionalInt(q: any): number | undefined {
  if (q === undefined || q === null || q === "") return undefined;
  const n = Number(q);
  if (!Number.isInteger(n) || n <= 0) return undefined;
  return n;
}


export const registrationController = {


  async approveAllPending(req: Request, res: Response) {
    try {
      const eventId = toOptionalInt(req.query.eventId);
      const result = await registrationService.approveAllPendingRegistrations(eventId);
      return res.json({ approvedCount: result });
    } catch (err: any) {
      console.error("Error approving all pending registrations: ", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const eventId = toOptionalInt(req.query.eventId);
      const registrations = await registrationService.getAllRegistrations(eventId);
      return res.json(registrations);
    } catch (err) {
      console.error("Error getting registrations:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },


  async create(req: Request, res: Response) {
    try {
      const {
        salutation,
        firstName,
        lastName,
        email,
        confirmEmail,
        street,
        addressExtra,
        zipCode,
        city,
        school,
        grade,
        motivation,
        comments,
      } = req.body;

      if (
        !salutation ||
        !firstName ||
        !lastName ||
        !email ||
        !confirmEmail ||
        !street ||
        !zipCode ||
        !city ||
        !school ||
        !grade
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const registration = await registrationService.createRegistration({
        salutation,
        firstName,
        lastName,
        email,
        confirmEmail,
        street,
        addressExtra,
        zipCode,
        city,
        school,
        grade,
        motivation,
        comments,
      });

      return res.status(201).json(registration);
    } catch (err: any) {
      if (err.message === "EMAIL_MISMATCH") {
        return res.status(400).json({ error: "E-mail addresses do not match" });
      }
      if (err.message === "NO_ACTIVE_EVENT") {
        return res.status(409).json({ error: "NO_ACTIVE_EVENT" });
      }

      console.error("Error in create registration:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },



  // Issue #33: Get registration by ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const registration = await registrationService.getRegistrationById(id);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      return res.json(registration);
    } catch (err) {
      console.error("Error getting registration:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // Issue #34: Approve registration
  async approve(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const registration = await registrationService.approveRegistration(id);
      return res.json(registration);
    } catch (err: any) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Registration not found" });
      }
      console.error("Error approving registration:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  // Issue #35: Reject registration
  async reject(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const registration = await registrationService.rejectRegistration(id);
      return res.json(registration);
    } catch (err: any) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Registration not found" });
      }
      console.error("Error rejecting registration:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },


};