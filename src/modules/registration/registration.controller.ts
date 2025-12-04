import { Request, Response } from "express";
import { registrationService } from "./registration.service";

export const registrationController = {
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

      // Validation
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
        return res
          .status(400)
          .json({ error: "E-mail addresses do not match" });
      }

      console.error("Error in create registration:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};