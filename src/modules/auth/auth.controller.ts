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
};