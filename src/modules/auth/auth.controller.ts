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
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    try {
      await authService.forgotPassword(email);
      return res.json({ status: "ok" });
    } catch (err) {
      console.error("Error in forgotPassword:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Missing token or newPassword" });
    }

    if (!newPassword || newPassword.length < 8) {
  return res.status(400).json({ error: "PASSWORD_TOO_SHORT" });
}


    try {
      await authService.resetPassword(token, newPassword);
      return res.json({ status: "ok" });
    } catch (err: any) {
      
      if (["INVALID_TOKEN", "TOKEN_USED", "TOKEN_EXPIRED"].includes(err.message)) {
        return res.status(400).json({ error: err.message });
      }

      console.error("Error in resetPassword:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};