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
        return res
          .status(401)
          .json({ error: "Invalid email or password" });
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

    await authService.forgotPassword(email);

    return res.json({ status: "ok" });
  },

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body ?? {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "TOKEN_REQUIRED" });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "WEAK_PASSWORD" });
    }

    const ok = await authService.resetPassword(token, newPassword);
    if (!ok) return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });

    return res.json({ status: "ok" });
  },
};