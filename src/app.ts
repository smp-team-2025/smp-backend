import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.router";


export const app = express();

app.use(cors());
app.use(express.json());

//Health check for the server
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

//Auth endpoint
app.use("/api/auth", authRouter);