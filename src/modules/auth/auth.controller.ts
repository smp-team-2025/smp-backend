import { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    try {
      const { user, token } = await authService.login(email, password);

      return res.status(200).json({
        user,
        token,
      });
    } catch (err: any) {
      if (err.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      console.error("Error in login:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body ?? {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "EMAIL_REQUIRED" });
    }

    try {
      await authService.forgotPassword(email);

      return res.json({
        status: "ok",
        message:
          "Die E-Mail wurde erfolgreich gesendet. Falls Sie keine E-Mail erhalten, prüfen Sie bitte Ihren Spam-Ordner oder stellen Sie sicher, dass Sie Ihre E-Mail-Adresse korrekt eingegeben haben.",
      });
    } catch (err) {
      console.error("Error in forgotPassword:", err);
      return res.status(500).json({ error: "FORGOT_PASSWORD_FAILED" });
    }
  },
};