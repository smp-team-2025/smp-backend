import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthPayload = {
  userId: number;
  role: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    (req as any).auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth as AuthPayload | undefined;
    if (!auth) return res.status(401).json({ error: "UNAUTHORIZED" });

    if (auth.role !== role) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    next();
  };
}