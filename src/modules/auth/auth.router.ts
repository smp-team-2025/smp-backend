import { Router } from "express";
import { authController } from "./auth.controller";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", authController.login);