import { Router } from "express";
import { authController } from "./auth.controller";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", authController.login);

// POST /api/auth/forgot-password
authRouter.post("/forgot-password", authController.forgotPassword);

// POST /api/auth/reset-password
authRouter.post("/reset-password", authController.resetPassword);
